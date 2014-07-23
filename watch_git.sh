#!/bin/bash
WATCH="/c/data/workspace/gitwatch/gitwatch.sh -e modify,delete,move,create -r origin"

# From http://sudrala.de/en_d/shell-getlink.html
# modified and exported (see bottom) to replace readlink from linux
function readlink # ([-f] path)
{
    # Print path of the file a symbolic link is pointing to.
    # Options:
    #   -f: follow link chain, print last target.
    #   no option: print first target unchanged.
    # Returns: 0 if all path components exist, 1 otherwise


    typeset dir file last link opt oldPWD=$PWD ret=0

    # debugging
    #
    #trap 'set +x' EXIT
    #PS4='+\W:$LINENO: '
    #set -x

    (( OPTIND = 1 ))

    while getopts "f" opt
    do
        case $opt in
        (f)     last=1
                ;;
        esac
    done

    shift $(( OPTIND - 1 ))

    file=$1

    # make absolute

    [[ $file != /* ]] && file=$PWD/$file

    # normalize

    typeset comp IFSold=$IFS i m n

    IFS=/               # split
    comp=($file)
    IFS=$IFSold

    n=${#comp[*]}
    m=0

    for (( i = 0; i < n; ++i ))
    do
        [[ ! ${comp[i]} ]] && continue

        if [[ ${comp[i]} == . ]]
        then
            unset comp[i]
        elif [[ ${comp[i]} == .. ]]
        then
            unset comp[i]

            for (( j = i - 1; j > 0; --j ))
            do
                [[ ${comp[j]} ]] &&
                {
                    unset comp[j]
                    break
                }
            done
        else
            (( ++m ))
        fi
    done

    # concatenate normalized components

    file=

    if (( m > 0 ))
    then
        for c in ${comp[*]}
        do
            file+="/$c"
        done
    else
        printf "/\n"
        return 0
    fi

    # get link

    typeset lnk=

    if [[ $last ]]              # last link
    then
        while true
        do
            # Does the file exist?

            [[ ! -e $file ]] &&
            {
                # no, print path and return 1

                printf "%s\n" "$file"
                return 1
            }

            # split path into dir and name

            dir=$(dirname "$file")  # dir
            file=${file##*/}        # filename

            # enter dir (physical)

            command cd -P "$dir"

            # is file a symbolic link?

            [[ ! -h $file ]] && break   # no

            # yes, get target from ls output

            link=$(command ls -l -- "$file"; printf x)
            link=${link%$'\nx'}
            remove="$file -> "
            file=${link#*"$remove"}
        done

        printf "%s\n" "$PWD/$file"
        command cd $oldPWD
    elif [[ ! -h $file ]]       # 1st link
    then
        printf "%s\n" "$file"
    else
        link=$(ls -l "$file")
        printf "%s\n" "${link##*-> }"
    fi

    return $ret
}

export -f readlink

$WATCH /c/data/Studio/songs &
$WATCH /c/data/workspace/documents &
