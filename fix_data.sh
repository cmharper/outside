#!/bin/bash

# fixes the weather data files by rebuilding them from scratch

# get the path of the folder containing this script
SCRIPTPATH="$( cd "$(dirname "$0")" || exit ; pwd -P )"  # shellcheck disable=SC2034

# go the directory holding this script
cd "${SCRIPTPATH}" || exit 1

# check if this is a git folder
if ! git rev-parse --show-toplevel >/dev/null 2>&1 ; then
    echo "Error: you must run this from within a git working directory" >&2
    exit 1
fi

# loop through all the places
for LOCATION in "n" "c"; do
    # define variables for this pass
    DATA=""

    # get all the old data from git and sort it
    # see: https://github.com/truist/settings/blob/master/bin/git_export_all_file_versions
    echo "Fetching data for ${LOCATION}"
    while read -r LINE; do
        COMMIT_DATE=$( echo "${LINE}" | cut -d ' ' -f 1 )
        COMMIT_SHA=$( echo "${LINE}" | cut -d ' ' -f 2 )
        printf "%s %s\\r" "${COMMIT_DATE}" "${COMMIT_SHA}"
        NEWDATA=$( git cat-file -p "${COMMIT_SHA}:data/${LOCATION}" )
        DATA=$( echo -e "${DATA}\n${NEWDATA}\n" | sort -u -t, -k 1 )
    done < <( git log --diff-filter=d --date-order --reverse --format="%ad %H" --date=iso-strict -- "data/${LOCATION}" | grep -v '^commit' )
    echo -e "${DATA}" > "/tmp/${LOCATION}.data"
    echo && echo "Processing ${LOCATION}"

    # get base of last line (which is guessed from the longest line)
    PARTS=$( grep -P "^\d{10}" "/tmp/${LOCATION}.data" | uniq | sort -g | awk '{ print length, $0 }' | sort -n -s | cut -d" " -f2- | tail -n 1 )
    TIME=$( echo "${PARTS}" | cut -d, -f1 )
    REPEATS=$( echo "${PARTS}" | cut -d, -f2 )
    LATITUDE=$( echo "${PARTS}" | cut -d, -f3 )
    LONGITUDE=$( echo "${PARTS}" | cut -d, -f4 )

    # get weather data points
    grep -Pv "\d{10}" "/tmp/${LOCATION}.data" | grep -E ".*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?,.*?" | grep -vE "^.*?,-99.9" | grep -vE "^.*?,999" | grep -vE "^.*?,65" | grep -vE ",,," | uniq | sort -g > "/tmp/${LOCATION}.new"

    # get the temperatures
    PARTS=$( sort -t, -k 2 -g "/tmp/${LOCATION}.new" | cut -d, -f1,2 | grep -vE ",-99.9" | grep -vE ",999" | grep -vE ",65" )
    LOWEST=$( echo "${PARTS}" | head -n 1 | cut -d, -f2 )
    HIGHEST=$( echo "${PARTS}" | tail -n 1 | cut -d, -f2 )
    LOWEST=$( echo "${PARTS}" | grep ",${LOWEST}$" | sort -g | head -n 1 )
    HIGHEST=$( echo "${PARTS}" | grep ",${HIGHEST}$" | sort -gr | head -n 1 )

    # get the snow and rain times
    LASTSNOW=$( grep -iE "snow|sleet|freez|ice|hail|mix|winter|flurr|icy|pellet" "/tmp/${LOCATION}.new" | sort -g | tail -n 1 | cut -d, -f1 )
    LASTRAIN=$( grep -iE "rain|thunder|drizzle" "/tmp/${LOCATION}.new" | sort -g | tail -n 1 | cut -d, -f1 )
    if [ -z "${LASTSNOW}" ]; then LASTSNOW=-1097; fi

    echo "${TIME},${REPEATS},${LATITUDE},${LONGITUDE},${LOWEST##*,},${LOWEST%,*},${HIGHEST##*,},${HIGHEST%,*},${LASTRAIN},${LASTSNOW}" >> "/tmp/${LOCATION}.new"
    mv "/tmp/${LOCATION}.new" "${HOME}/Desktop/${LOCATION}"
    tail -n 251 "${HOME}/Desktop/${LOCATION}" > "${HOME}/Desktop/${LOCATION}.latest"
done

exit 0
