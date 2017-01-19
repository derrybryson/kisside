#!/bin/bash
BASEDIR=`dirname "${0}"`
cd "$BASEDIR"

payload="$1"
script="$2"
tmp=__extract__$RANDOM

[ "$payload" != "" ] || read -e -p "Enter the path of the tar archive: " payload
[ "$script" != "" ] || read -e -p "Enter the name/path of the script: " script

printf "#!/bin/bash
PAYLOAD_LINE=\`awk '/^__PAYLOAD_BELOW__/ {print NR + 1; exit 0; }' \$0\`
tail -n+\$PAYLOAD_LINE \$0 | tar -xvz
#you can add custom installation command here

cd kissideinst
./setup.sh
cd ..
rm -rf kissideinst
exit 0
__PAYLOAD_BELOW__\n" > "$tmp"

cat "$tmp" "$payload" > "$script" && rm "$tmp"
chmod +x "$script"
