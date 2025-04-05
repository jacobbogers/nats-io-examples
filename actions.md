


```bash
PS C:\Users\jacob bogers> nsc add operator MyOperator
[ OK ] generated and stored operator key "OC4CEIP3U4IICPYDQRWTGMSW3AQOBJJWJZ2HHKMVLXEPHV6AIIXPB3PS"
[ OK ] added operator "MyOperator"
[ OK ] When running your own nats-server, make sure they run at least version 2.2.0

PS C:\Users\jacob bogers> nsc edit operator --service-url nats://localhost:4222
[ OK ] added service url "nats://localhost:4222"
[ OK ] edited operator "MyOperator"

PS C:\Users\jacob bogers> nsc add account MyAccount
[ OK ] generated and stored account key "AB3VHAI4RCTLLWD4PIG4XW32Z5NYR2S7NVEXIZX7OGWRKHHD7XJUJ4SO"
[ OK ] added account "MyAccount"
PS C:\Users\jacob bogers>

PS C:\Users\jacob bogers> nsc add user MyUser
[ OK ] generated and stored user key "UBDKWFRRKOP2FW2AUMD3WBAKMJYELFN67IPYKIOLD3NL5KBTBBRZ5P4G"
[ OK ] generated user creds file `~\.local\share\nats\nsc\keys\creds\MyOperator\MyAccount\MyUser.creds`

$NKEYS_PATH = ~/.nkeys
$NSC_HOME = ~/.nsc
$NSC_HOME/nats = <stores directory>

(on unix this would be `~/.nkeys/creds/MyOperator/MyAccount/MyUser.creds`)
[ OK ] added user "MyUser" to account "MyAccount"

PS C:\Users\jacob bogers\.local\share\nats> nsc generate config --nats-resolver
Error: system account is not set
PS C:\Users\jacob bogers\.local\share\nats> nsc add account -n SYS
[ OK ] generated and stored account key "ADX4PL7ZBCDANP3NA6C2FS32GORUOIHCKGYXSQIB4QZUKPZG37DRZLFY"
[ OK ] added account "SYS"
PS C:\Users\jacob bogers\.local\share\nats> nsc add account -n SYS`
[ OK ] generated and stored account key "ABFNNNJQLW7XVGMPWXEYYHYR7IYKI3VL3ILGI5UZRBPBLHA73LFH6ZEU"
[ OK ] added account "SYS`"
PS C:\Users\jacob bogers\.local\share\nats> nsc edit operator --system-account SYS
[ OK ] set system account "ADX4PL7ZBCDANP3NA6C2FS32GORUOIHCKGYXSQIB4QZUKPZG37DRZLFY"
[ OK ] edited operator "MyOperator"
```
