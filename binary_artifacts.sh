echo Refreshing binaries from artifacts.supernet.org
echo =========================================
echo Step: Removing old binaries
mkdir -p build
cd build
rm -rvf artifacts.supernet.org
echo
echo Step: Cloning latest binaries for build
wget --recursive --no-parent https://artifacts.supernet.org/latest/
chmod -R +x artifacts.supernet.org/latest/
cd ..
echo =========================================
echo 
echo =========================================
echo Step: Moving osx binaries from artifacts to assets/bin/osx/
echo 
mv -fv build/artifacts.supernet.org/latest/osx/iguana assets/bin/osx/
mv -fv build/artifacts.supernet.org/latest/osx/komodo-cli assets/bin/osx/
mv -fv build/artifacts.supernet.org/latest/osx/komodod assets/bin/osx/
mv -fv build/artifacts.supernet.org/latest/osx/libgcc_s.1.dylib assets/bin/osx/
mv -fv build/artifacts.supernet.org/latest/osx/libgomp.1.dylib assets/bin/osx/
mv -fv build/artifacts.supernet.org/latest/osx/libnanomsg.5.0.0.dylib assets/bin/osx/
mv -fv build/artifacts.supernet.org/latest/osx/libstdc++.6.dylib assets/bin/osx/
echo 
echo =========================================
echo Step: Moving Win64 binaries from artifacts to assets/bin/win64/
echo 
mv -fv build/artifacts.supernet.org/latest/windows/genkmdconf.bat assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/iguana.exe assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/index.html assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/komodo-cli.exe assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/komodo-tx.exe assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/komodod.exe assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/libcrypto-1_1.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/libcurl-4.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/libcurl.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/libgcc_s_sjlj-1.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/libnanomsg.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/libssl-1_1.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/libwinpthread-1.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/nanomsg.dll assets/bin/win64/
mv -fv build/artifacts.supernet.org/latest/windows/pthreadvc2.dll assets/bin/win64/
echo 
echo =========================================
echo Step: Moving linux64 binaries from artifacts to assets/bin/linux64
echo 
mv -fv build/artifacts.supernet.org/latest/linux/iguana assets/bin/linux64/
mv -fv build/artifacts.supernet.org/latest/linux/komodo-cli assets/bin/linux64/
mv -fv build/artifacts.supernet.org/latest/linux/komodod assets/bin/linux64/
echo 
echo =========================================
echo Step: Cleaning artifacts data
echo 
rm -rf build/
echo 
echo =========================================
echo Step: Finished Updating binaries from artifacts
echo 