#!/bin/sh
echo '# Installing postgresql'
brew install postgresql
echo '# Starting postgresql'
initdb /usr/local/var/postgres -E utf8
echo '# Setting up services'
sudo gem install lunchy
mkdir -p ~/Library/LaunchAgents
cp /usr/local/Cellar/postgresql/9.2.1/homebrew.mxcl.postgresql.plist ~/Library/LaunchAgents/
launchctl load -w ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist
lunchy start postgres
createdb `whoami`
createdb 'lackey-cms-test'
