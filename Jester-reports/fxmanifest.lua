fx_version 'cerulean'
game 'gta5'

author 'Jester'
description 'Jester Reports Gemaakt door Jester Dev'
version '1.0.0'

lua54 'yes' -- Enable Lua 5.4

shared_scripts {
    '@es_extended/imports.lua',
    '@ox_lib/init.lua',
    'config.lua'
}

client_scripts {
    'client/client.lua'
}

server_scripts {
    '@mysql-async/lib/MySQL.lua',
    'server/server.lua'
}

ui_page 'web/index.html'

files {
    'web/index.html',
    'web/style.css',
    'web/script.js'
}

dependencies {
    'es_extended',
    'ox_lib',
    'mysql-async'
}