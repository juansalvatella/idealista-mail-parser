#!/bin/bash
cd functions
npm run build
cd ..
export GOOGLE_APPLICATION_CREDENTIALS="/Users/joansalvatella/repos/personal/idealista-mail/keys/idealista-mail-19878-c93928a8db87.json"
firebase emulators:start
