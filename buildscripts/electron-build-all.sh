#!/bin/bash
### Build script for Iguana application for Linux x32 and x64 platform.
### Created by mmaxian, 3/2017

[ -z $IGUANA_VERSION ] && echo "IGUANA_VERSION variable is not set." && exit 0

echo "Build script for Iguana application for Linux x32 and x64 platform."
echo "Preparing electron package $IGUANA_VERSION" && \ 
source ./electron-build-linux.sh && echo "done."

echo "Build script for Iguana application for Windows ia32 and x64 platform."
echo "Preparing electron package $IGUANA_VERSION" && \ 
source ./electron-build-win.sh && echo "done."

echo "Build script for Iguana application for MacOS platform."
echo "Preparing electron package $IGUANA_VERSION" && \ 
source ./electron-build-osx.sh && echo "done."