Config = {}

-- Report types available in the dropdown
Config.ReportTypes = {
    { value = 'player', label = 'Player Report' },
    { value = 'bug', label = 'Bug Report' },
    { value = 'other', label = 'Other' }
}

-- Staff groups allowed to use /reports (ESX group ranks)
Config.StaffGroups = {
    'admin',
    'superadmin'
}

-- Notification settings
Config.Notify = {
    success = 'Report submitted successfully!',
    error = 'Failed to submit report. Please fill all fields.',
    staffNotify = 'New report submitted by %s (ID: %s)',
    citizenConfirm = 'Your report #%d has been submitted and is awaiting staff review.',
    citizenStaffResponse = 'Staff has responded to your report #%d. Check the chat for details.',
    citizenRejected = 'Your report #%d has been closed by staff.',
    noPermission = 'You do not have permission to view reports.',
    reportRejected = 'Report #%d has been closed.',
    messageSent = 'Message sent in report #%d.',
    noReports = 'You have no reports to display.'
}

-- UI configuration for script.js
Config.UI = {
    title = 'Jester Reports',
    reportingUserLabel = 'REPORTING USER',
    welcomeMessage = 'Welcome, %s'
}

-- Discord webhook for logging (optional)
Config.Webhook = ''