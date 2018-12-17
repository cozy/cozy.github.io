#!/bin/bash

_term() {
  kill -INT $pid
}

trap _term SIGINT

couch_addr="http://127.0.0.1:5984"
curl -s $couch_addr/_all_dbs | jq -r '.[]' | grep "registry-" | \
  xargs -I % python -c "import urllib; print urllib.quote('''%''', safe='')" | \
  xargs -I % curl -X DELETE ${couch_addr}/%

reg1=("banks" "drive" "health" "photos" "collect" "store")
reg2=("drive" "homebook" "banks" "collect")
mesinfos=("banks" "digiposte" "collect" "drive" "onboarding" "photos" "settings")

cozy-apps-registry add-editor Cozy --auto-publication
cozy-apps-registry add-editor MesInfos --auto-publication
cozy-apps-registry --port 8081 --spaces __default__,reg2,mesinfos serve &
pid=$!
sleep 1

for name in "${reg1[@]}"; do
  curl \
    --silent --fail \
    -X POST http://localhost:8081/registry/ \
    -H 'Content-Type:application/json' \
    -H "Authorization: Token $(cozy-apps-registry gen-token --master Cozy)" \
    -d "{\"slug\": \"${name}\", \"editor\":\"cozy\", \"type\": \"webapp\"}" \
    > /dev/null
done

for name in "${reg2[@]}"; do
  curl \
    --silent --fail \
    -X POST http://localhost:8081/reg2/registry/ \
    -H 'Content-Type:application/json' \
    -H "Authorization: Token $(cozy-apps-registry gen-token --master Cozy)" \
    -d "{\"slug\": \"${name}\", \"editor\":\"cozy\", \"type\": \"webapp\"}" \
    > /dev/null
done

for name in "${mesinfos[@]}"; do
  curl \
    --silent --fail \
    -X POST http://localhost:8081/mesinfos/registry \
    -H 'Content-Type:application/json' \
    -H "Authorization: Token $(cozy-apps-registry gen-token --master Cozy)" \
    -d "{\"slug\": \"${name}\", \"editor\":\"MesInfos\", \"type\": \"webapp\"}" \
    > /dev/null
done

echo "Ready !"
cat
