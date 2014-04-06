backlog-cli
==============================================================================

[Backlog](http://www.backlog.jp/) command line interface. (unofficial)


Usage
------------------------------------------------------------------------------

### Installation

    $ npm install -g backlog-cli

### Help

    $ backlog help

### Examples

#### use option

    $ backlog project list -s 'space-id' -u 'username' -p 'password'

#### use env

    $ export BACKLOG_SPACE_ID='space-id'
    $ export BACKLOG_USERNAME='username'
    $ export BACKLOG_PASSWORD='password'
    $
    $ backlog project list

#### use authentication data file (~/.backlog.json)

    $ # create authentication data file
    $ backlog login -s 'space-id' -u 'username' -p 'password'
    $
    $ cat ~/.backlog.json
    {"spaceId":"space-id","username":"username","password":"password"}
    $
    $ backlog project list
    $
    $ # delete authentication data file
    $ backlog logout

