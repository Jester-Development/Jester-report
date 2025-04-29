local isMenuOpen = false

-- Register /report command for citizens
RegisterCommand('report', function()
    OpenReportMenu()
end, false)

-- Register /reports command for staff
RegisterCommand('reports', function()
    ESX.TriggerServerCallback('jester-reports:checkPermission', function(hasPermission)
        if hasPermission then
            OpenReportsList()
        else
            lib.notify({ title = 'Error', description = Config.Notify.noPermission, type = 'error' })
        end
    end)
end, false)

-- Register /myreports command for citizens
RegisterCommand('myreports', function()
    OpenMyReports()
end, false)

-- Open report creation menu
function OpenReportMenu()
    if isMenuOpen then return end
    isMenuOpen = true
    SetNuiFocus(true, true)
    local xPlayer = ESX.GetPlayerData()
    SendNUIMessage({
        type = 'toggleMenu',
        show = true,
        playerName = xPlayer.name,
        config = Config.UI
    })
end

-- Open reports list for staff
function OpenReportsList()
    if isMenuOpen then return end
    isMenuOpen = true
    SetNuiFocus(true, true)
    ESX.TriggerServerCallback('jester-reports:getReports', function(reports)
        SendNUIMessage({
            type = 'updateReports',
            show = true,
            reports = reports,
            config = Config.UI
        })
    end)
end

-- Open player's own reports
function OpenMyReports()
    if isMenuOpen then return end
    isMenuOpen = true
    SetNuiFocus(true, true)
    ESX.TriggerServerCallback('jester-reports:getPlayerReports', function(reports)
        if reports and #reports > 0 then
            SendNUIMessage({
                type = 'updateReports',
                show = true,
                reports = reports,
                config = Config.UI
            })
        else
            lib.notify({ title = 'Info', description = Config.Notify.noReports, type = 'info' })
            isMenuOpen = false
            SetNuiFocus(false, false)
        end
    end)
end

-- NUI Callbacks
RegisterNUICallback('submitReport', function(data, cb)
    ESX.TriggerServerCallback('jester-reports:submitReport', function(success, reportId)
        if success then
            lib.notify({ title = 'Success', description = string.format(Config.Notify.citizenConfirm, reportId), type = 'success' })
            SendNUIMessage({ type = 'toggleMenu', show = false })
            isMenuOpen = false
            SetNuiFocus(false, false)
        else
            lib.notify({ title = 'Error', description = Config.Notify.error, type = 'error' })
        end
    end, data)
    cb('ok')
end)

RegisterNUICallback('closeMenu', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('closeReportsList', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('closeChat', function(data, cb)
    isMenuOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('getReportMessages', function(data, cb)
    ESX.TriggerServerCallback('jester-reports:getReport', function(report)
        if report then
            SendNUIMessage({
                type = 'showReportChat',
                report = {
                    id = report.id,
                    type = report.type,
                    subject = report.subject,
                    report_text = report.report_text,
                    messages = report.messages
                }
            })
        else
            lib.notify({ title = 'Error', description = Config.Notify.reportNotFound, type = 'error' })
        end
    end, data.reportId)
    cb('ok')
end)

RegisterNUICallback('sendMessage', function(data, cb)
    ESX.TriggerServerCallback('jester-reports:sendMessage', function(success, message)
        if success then
            lib.notify({ title = 'Success', description = string.format(Config.Notify.messageSent, data.reportId), type = 'success' })
            SendNUIMessage({
                type = 'newMessage',
                reportId = data.reportId,
                message = message
            })
        else
            lib.notify({ title = 'Error', description = 'Failed to send message.', type = 'error' })
        end
    end, data.reportId, data.message)
    cb('ok')
end)

RegisterNUICallback('updateReportStatus', function(data, cb)
    ESX.TriggerServerCallback('jester-reports:updateReportStatus', function(success)
        if success then
            lib.notify({ title = 'Success', description = string.format(Config.Notify.reportRejected, data.reportId), type = 'success' })
            SendNUIMessage({ type = 'reportDeleted', reportId = data.reportId })
            OpenReportsList()
        else
            lib.notify({ title = 'Error', description = 'Failed to update report status.', type = 'error' })
        end
    end, data.reportId, data.status)
    cb('ok')
end)

RegisterNUICallback('teleportToPlayer', function(data, cb)
    ESX.TriggerServerCallback('jester-reports:teleportToPlayer', function(success, coords)
        if success and coords then
            local ped = PlayerPedId()
            SetEntityCoords(ped, coords.x, coords.y, coords.z, false, false, false, true)
            lib.notify({ title = 'Success', description = 'Teleported to the player.', type = 'success' })
        else
            lib.notify({ title = 'Error', description = 'Failed to teleport. Player may be offline.', type = 'error' })
        end
    end, data.reportId)
    cb('ok')
end)

-- Handle notifications for citizen (triggered by server)
RegisterNetEvent('jester-reports:notifyCitizen')
AddEventHandler('jester-reports:notifyCitizen', function(type, reportId)
    if type == 'staffResponse' then
        lib.notify({ title = 'Report Update', description = string.format(Config.Notify.citizenStaffResponse, reportId), type = 'inform' })
    elseif type == 'rejected' then
        lib.notify({ title = 'Report Closed', description = string.format(Config.Notify.citizenRejected, reportId), type = 'error' })
    end
end)