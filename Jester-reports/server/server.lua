-- Check staff permission
ESX.RegisterServerCallback('jester-reports:checkPermission', function(source, cb)
    local xPlayer = ESX.GetPlayerFromId(source)
    MySQL.Async.fetchScalar('SELECT `group` FROM users WHERE identifier = @identifier', {
        ['@identifier'] = xPlayer.identifier
    }, function(group)
        if group then
            for _, staffGroup in ipairs(Config.StaffGroups) do
                if group == staffGroup then
                    return cb(true)
                end
            end
        end
        cb(false)
    end)
end)

-- Submit a report
ESX.RegisterServerCallback('jester-reports:submitReport', function(source, cb, data)
    local xPlayer = ESX.GetPlayerFromId(source)
    if not data.type or not data.subject or not data.report then
        return cb(false)
    end

    MySQL.Async.execute([[
        INSERT INTO jester_reports (player_id, player_name, type, subject, report_text, status)
        VALUES (@player_id, @player_name, @type, @subject, @report_text, 'open')
    ]], {
        ['@player_id'] = xPlayer.identifier,
        ['@player_name'] = xPlayer.getName(),
        ['@type'] = data.type,
        ['@subject'] = data.subject,
        ['@report_text'] = data.report
    }, function(rowsAffected)
        if rowsAffected > 0 then
            MySQL.Async.fetchScalar('SELECT LAST_INSERT_ID()', {}, function(reportId)
                -- Notify citizen
                TriggerClientEvent('jester-reports:notifyCitizen', source, 'confirm', reportId)

                -- Notify staff
                for _, playerId in ipairs(GetPlayers()) do
                    local xTarget = ESX.GetPlayerFromId(playerId)
                    MySQL.Async.fetchScalar('SELECT `group` FROM users WHERE identifier = @identifier', {
                        ['@identifier'] = xTarget.identifier
                    }, function(group)
                        if group then
                            for _, staffGroup in ipairs(Config.StaffGroups) do
                                if group == staffGroup then
                                    TriggerClientEvent('ox_lib:notify', playerId, {
                                        title = 'New Report',
                                        description = string.format(Config.Notify.staffNotify, xPlayer.getName(), reportId),
                                        type = 'inform'
                                    })
                                end
                            end
                        end
                    end)
                end

                -- Discord webhook
                if Config.Webhook ~= '' then
                    PerformHttpRequest(Config.Webhook, function(err, text, headers) end, 'POST', json.encode({
                        content = string.format('New report by %s (ID: %d)\nType: %s\nSubject: %s\nDescription: %s',
                            xPlayer.getName(), reportId, data.type, data.subject, data.report)
                    }), { ['Content-Type'] = 'application/json' })
                end

                cb(true, reportId)
            end)
        else
            cb(false)
        end
    end)
end)

-- Get all reports (for staff)
ESX.RegisterServerCallback('jester-reports:getReports', function(source, cb)
    MySQL.Async.fetchAll('SELECT * FROM jester_reports WHERE status = "open"', {}, function(reports)
        cb(reports)
    end)
end)

-- Get player's own reports (for /myreports)
ESX.RegisterServerCallback('jester-reports:getPlayerReports', function(source, cb)
    local xPlayer = ESX.GetPlayerFromId(source)
    MySQL.Async.fetchAll('SELECT * FROM jester_reports WHERE player_id = @player_id', {
        ['@player_id'] = xPlayer.identifier
    }, function(reports)
        cb(reports)
    end)
end)

-- Get a specific report with messages
ESX.RegisterServerCallback('jester-reports:getReport', function(source, cb, reportId)
    MySQL.Async.fetchAll([[
        SELECT r.*, m.id AS message_id, m.sender_id, m.sender_name, m.message, m.is_admin, m.created_at
        FROM jester_reports r
        LEFT JOIN jester_report_messages m ON r.id = m.report_id
        WHERE r.id = @reportId
    ]], {
        ['@reportId'] = reportId
    }, function(results)
        if results[1] then
            local report = {
                id = results[1].id,
                player_id = results[1].player_id,
                player_name = results[1].player_name,
                type = results[1].type,
                subject = results[1].subject,
                report_text = results[1].report_text,
                status = results[1].status,
                created_at = results[1].created_at,
                messages = {}
            }
            for _, row in ipairs(results) do
                if row.message_id then
                    table.insert(report.messages, {
                        id = row.message_id,
                        sender_id = row.sender_id,
                        sender_name = row.sender_name,
                        message = row.message,
                        is_admin = row.is_admin == 1,
                        created_at = row.created_at
                    })
                end
            end
            cb(report)
        else
            cb(nil)
        end
    end)
end)

-- Send a message to a report
ESX.RegisterServerCallback('jester-reports:sendMessage', function(source, cb, reportId, message)
    local xPlayer = ESX.GetPlayerFromId(source)
    local isAdmin = false

    -- Check if player is staff
    MySQL.Sync.fetchScalar('SELECT `group` FROM users WHERE identifier = @identifier', {
        ['@identifier'] = xPlayer.identifier
    }, function(group)
        if group then
            for _, staffGroup in ipairs(Config.StaffGroups) do
                if group == staffGroup then
                    isAdmin = true
                    break
                end
            end
        end
    end)

    -- Insert message
    MySQL.Async.execute([[
        INSERT INTO jester_report_messages (report_id, sender_id, sender_name, message, is_admin)
        VALUES (@report_id, @sender_id, @sender_name, @message, @is_admin)
    ]], {
        ['@report_id'] = reportId,
        ['@sender_id'] = xPlayer.identifier,
        ['@sender_name'] = xPlayer.getName(),
        ['@message'] = message,
        ['@is_admin'] = isAdmin and 1 or 0
    }, function(rowsAffected)
        if rowsAffected > 0 then
            MySQL.Async.fetchScalar('SELECT LAST_INSERT_ID()', {}, function(messageId)
                local messageData = {
                    id = messageId,
                    sender_id = xPlayer.identifier,
                    sender_name = xPlayer.getName(),
                    message = message,
                    is_admin = isAdmin,
                    created_at = os.date('%Y-%m-%d %H:%M:%S')
                }
                -- Notify report creator if staff sent the message
                if isAdmin then
                    MySQL.Async.fetchAll('SELECT player_id FROM jester_reports WHERE id = @reportId', {
                        ['@reportId'] = reportId
                    }, function(result)
                        if result[1] and result[1].player_id ~= xPlayer.identifier then
                            local targetId = GetPlayerFromIdentifier(result[1].player_id)
                            if targetId then
                                TriggerClientEvent('jester-reports:notifyCitizen', targetId, 'staffResponse', reportId)
                            end
                        end
                        cb(true, messageData)
                    end)
                else
                    cb(true, messageData)
                end
            end)
        else
            cb(false)
        end
    end)
end)

-- Update report status (only for reject/close)
ESX.RegisterServerCallback('jester-reports:updateReportStatus', function(source, cb, reportId, status)
    local xPlayer = ESX.GetPlayerFromId(source)
    MySQL.Async.execute('UPDATE jester_reports SET status = @status WHERE id = @reportId', {
        ['@status'] = status,
        ['@reportId'] = reportId
    }, function(rowsAffected)
        if rowsAffected > 0 then
            -- Notify the report creator
            MySQL.Async.fetchAll('SELECT player_id FROM jester_reports WHERE id = @reportId', {
                ['@reportId'] = reportId
            }, function(result)
                if result[1] then
                    local targetId = GetPlayerFromIdentifier(result[1].player_id)
                    if targetId then
                        TriggerClientEvent('jester-reports:notifyCitizen', targetId, status, reportId)
                    end
                end
            end)

            -- Discord webhook
            if Config.Webhook ~= '' then
                PerformHttpRequest(Config.Webhook, function(err, text, headers) end, 'POST', json.encode({
                    content = string.format('Report #%d %s by %s', reportId, status, xPlayer.getName())
                }), { ['Content-Type'] = 'application/json' })
            end
            cb(true)
        else
            cb(false)
        end
    end)
end)

-- Teleport to player
ESX.RegisterServerCallback('jester-reports:teleportToPlayer', function(source, cb, reportId)
    local xPlayer = ESX.GetPlayerFromId(source)
    MySQL.Async.fetchAll('SELECT player_id FROM jester_reports WHERE id = @reportId', {
        ['@reportId'] = reportId
    }, function(result)
        if result[1] then
            local targetId = GetPlayerFromIdentifier(result[1].player_id)
            if targetId then
                local xTarget = ESX.GetPlayerFromId(targetId)
                local coords = GetEntityCoords(GetPlayerPed(targetId))
                cb(true, { x = coords.x, y = coords.y, z = coords.z })
            else
                cb(false, nil)
            end
        else
            cb(false, nil)
        end
    end)
end)

-- Helper function to get player ID from identifier
function GetPlayerFromIdentifier(identifier)
    for _, playerId in ipairs(GetPlayers()) do
        local xPlayer = ESX.GetPlayerFromId(playerId)
        if xPlayer.identifier == identifier then
            return playerId
        end
    end
    return nil
end