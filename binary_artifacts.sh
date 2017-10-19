echo Refreshing binaries from artifacts.supernet.org
echo =========================================
echo Step: Removing old binaries
pwd
[ ! -d assets ] && \
  mkdir -p assets
cd assets
[ -d artifacts.supernet.org ] && \
  echo Removing old artifacts. && \
  rm -rvf artifacts.supernet.org
echo
echo Step: Cloning latest binaries for build
wget --recursive --no-parent https://artifacts.supernet.org/latest/
cd ..
echo =========================================
echo
pwd
echo =========================================
echo Step: Permission +x for OSX binaries from artifacts to assets/bin/osx/
echo
chmod +x assets/artifacts.supernet.org/latest/osx/iguana \
  assets/artifacts.supernet.org/latest/osx/komodo*

#cp -rvf assets/artifacts.supernet.org/latest/osx/* assets/bin/osx/
mkdir assets/bin
echo Moving OSX bins to assets/bin
wget https://supernetorg.bintray.com/binaries/komodo_OSX_latest.zip
checksum=`shasum -a 256 komodo_OSX_latest.zip | awk '{ print $1 }'`
if [ "$checksum" = "c20a1b7268dd0d9bbc8984a0e76cc868d8b4479af18cd1dde4406f63b7f12255" ]; then
    echo "Checksum is correct."
    unzip komodo_OSX_latest.zip
    mv komodo_OSX_latest assets/bin/osx
  else
    echo "Checksum is incorrect!"
    exit 0
fi
echo =========================================
echo Step: Moving Windows binaries from artifacts to assets/bin/win64/
#echo
mv assets/artifacts.supernet.org/latest/windows assets/bin/win64
echo
echo =========================================
echo Step: Permissions +x for linux64 binaries from artifacts to assets/bin/linux64
echo
chmod +x assets/artifacts.supernet.org/latest/linux/iguana \
  assets/artifacts.supernet.org/latest/linux/komodo*
echo Moving Linux bins to assets/bin
mv assets/artifacts.supernet.org/latest/linux assets/bin/linux64/
echo
echo =========================================
echo Step: Finished Updating binaries from artifacts
echo
