mkdir %AppData%\Komodo

@echo off

IF NOT EXIST %AppData%\Komodo\komodo.conf (
   (
    echo rpcuser=kmdusr%random%%random%
    echo rpcpassword=kmdpass%random%%random%
    echo rpcbind=127.0.0.1
	echo txindex=1
	echo server=1
	echo addnode=5.9.102.210
	echo addnode=78.47.196.146
	echo addnode=178.63.69.164
	echo addnode=88.198.65.74
	echo addnode=5.9.122.241
	echo addnode=144.76.94.38
    ) > %AppData%\Komodo\komodo.conf
)