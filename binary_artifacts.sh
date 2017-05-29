echo Refreshing binaries from artifacts.supernet.org
echo =========================================
echo Step: Removing old binaries
pwd
[ ! -d build ] && mkdir -p build
cd build
rm -rvf artifacts.supernet.org
echo
echo Step: Cloning latest binaries for build
wget --recursive --no-parent https://artifacts.supernet.org/latest/
cd ..
echo =========================================
echo
pwd 
echo =========================================
echo Step: Moving osx binaries from artifacts to assets/bin/osx/
echo 
chmod +x build/artifacts.supernet.org/latest/osx/iguana \
  build/artifacts.supernet.org/latest/osx/komodo*
cp -rvf build/artifacts.supernet.org/latest/osx/* assets/bin/osx/
echo 
echo =========================================
echo Step: Moving Win64 binaries from artifacts to assets/bin/win64/
echo 
cp -rvf build/artifacts.supernet.org/latest/windows/* assets/bin/win64/
echo 
echo =========================================
echo Step: Moving linux64 binaries from artifacts to assets/bin/linux64
echo 
chmod +x build/artifacts.supernet.org/latest/linux/iguana \
  build/artifacts.supernet.org/latest/linux/komodo*
cp -rvf build/artifacts.supernet.org/latest/linux/* assets/bin/linux64/
echo 
echo =========================================
echo Step: Finished Updating binaries from artifacts
echo 