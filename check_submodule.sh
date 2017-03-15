#!/bin/bash
### Script will check EasyDEX-GUI submodule in gui folder. 
### If you used git clone without --recursive option this is way to go.

PWD=`pwd`
SIZE=`du -sk gui/EasyDEX-GUI`

echo "Checking EasyDEX-GUI folder."
cd gui/EasyDEX-GUI && \
git submodule update --init --recursive && \
cd ../.. && \
echo "Folder looks fine." || \
echo "Some problem with cloning submodule EasyDEX-GUI." 
echo
