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
#echo 
#echo =========================================
#echo Step: Copying Windows binaries from artifacts to assets/bin/win64/
#echo 
#cp -rvf assets/artifacts.supernet.org/latest/windows/* assets/bin/win64/
echo 
echo =========================================
echo Step: Permissions +x for linux64 binaries from artifacts to assets/bin/linux64
echo 
chmod +x assets/artifacts.supernet.org/latest/linux/iguana \
  assets/artifacts.supernet.org/latest/linux/komodo*
#cp -rvf assets/artifacts.supernet.org/latest/linux/* assets/bin/linux64/
echo 
echo =========================================
echo Step: Finished Updating binaries from artifacts
echo 
