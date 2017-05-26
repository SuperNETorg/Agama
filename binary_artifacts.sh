echo Refreshing binaries from artifacts.supernet.org
echo =========================================
echo Step: Removing old binaries
cd build
rm -rvf artifacts.supernet.org
echo
echo Step: Cloning latest binaries for build
wget --recursive --no-parent https://artifacts.supernet.org/latest/
cd ..
echo =========================================
echo
