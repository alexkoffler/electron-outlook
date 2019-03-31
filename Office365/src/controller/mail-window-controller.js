const { BrowserWindow, shell, ipcMain, Menu } = require('electron')
const settings = require('electron-settings')
const CssInjector = require('../js/css-injector')
const path = require('path')

const outlookUrl = 'https://mail.office365.com/mail'
const deeplinkUrls = ['outlook-sdf.office.com/mail/deeplink', 'outlook.office365.com/mail/deeplink', 'outlook.office.com/mail/deeplink']
const outlookUrls = ['outlook-sdf.office.com', 'outlook.office.com', 'outlook.office365.com',
'outlook.office365.com/calendar', 'outlook.office365.com/people', 'outlook.office365.com/files']

class MailWindowController {
    constructor() {
        this.init()
    }

    init() {
        // Get configurations.
        const showWindowFrame = settings.get('showWindowFrame', true)

        // Create the browser window.
        this.win = new BrowserWindow({
            x: 100,
            y: 100,
            width: 1400,
            height: 900,
            frame: showWindowFrame,
            autoHideMenuBar: true,
            show: false,
            icon: path.join(__dirname, '../../assets/outlook_linux_black.png')
        })

        // and load the index.html of the app.
        this.win.loadURL(outlookUrl)

        // Show window handler
        ipcMain.on('show', (event) => {
            this.show()
        })

        // insert styles
        this.win.webContents.on('dom-ready', () => {
            this.win.webContents.insertCSS(CssInjector.main)
            if (!showWindowFrame) this.win.webContents.insertCSS(CssInjector.noFrame)

            this.addUnreadNumberObserver()

            this.win.show()
        })

        // prevent the app quit, hide the window instead.
        this.win.on('close', (e) => {
            if (this.win.isVisible()) {
                e.preventDefault()
                this.win.hide()
            }
        })

        // Emitted when the window is closed.
        this.win.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.win = null
        })

        // Open the new window in external browser
        this.win.webContents.on('new-window', this.openInBrowser)

        // Create the Application's main menu
        var template = [{
            label: "Application",
            submenu: [
                { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
                { type: "separator" },
                { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
            ]}, {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Y", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]}
        ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    addUnreadNumberObserver() {
        // this.win.webContents.executeJavaScript(`
        //     setTimeout(() => {
        //         let unreadSpan = document.querySelector('._2iKri0mE1PM9vmRn--wKyI');
        //         require('electron').ipcRenderer.send('updateUnread', unreadSpan.hasChildNodes());

        //         let observer = new MutationObserver(mutations => {
        //             mutations.forEach(mutation => {
        //                 console.log('Observer Changed.');
        //                 require('electron').ipcRenderer.send('updateUnread', unreadSpan.hasChildNodes());

        //                 // Scrape messages and pop up a notification
        //                 var messages = document.querySelectorAll('div[role="listbox"][aria-label="Message list"]');
        //                 if (messages.length)
        //                 {
        //                     var unread = messages[0].querySelectorAll('div[aria-label^="Unread"]');
        //                     var body = "";
        //                     for (var i = 0; i < unread.length; i++)
        //                     {
        //                         if (body.length)
        //                         {
        //                             body += "\\n";
        //                         }
        //                         body += unread[i].getAttribute("aria-label").substring(7, 127);
        //                     }
        //                     if (unread.length)
        //                     {
        //                         var notification = new Notification(unread.length + " New Messages", {
        //                             body: body,
        //                             icon: "assets/outlook_linux_black.png"
        //                         });
        //                         notification.onclick = () => {
        //                             require('electron').ipcRenderer.send('show');
        //                         };
        //                     }
        //                 }
        //             });
        //         });
            
        //         observer.observe(unreadSpan, {childList: true});

        //         // If the div containing reminders gets taller we probably got a new
        //         // reminder, so force the window to the top.
        //         let reminders = document.getElementsByClassName("_1BWPyOkN5zNVyfbTDKK1gM");
        //         let height = 0;
        //         let reminderObserver = new MutationObserver(mutations => {
        //             mutations.forEach(mutation => {
        //                 if (reminders[0].clientHeight > height)
        //                 {
        //                     require('electron').ipcRenderer.send('show');
        //                 }
        //                 height = reminders[0].clientHeight;
        //             });
        //         });

        //         if (reminders.length) {
        //             reminderObserver.observe(reminders[0], { childList: true });
        //         }

        //     }, 10000);
        // `)
    }

    toggleWindow() {
        if (this.win.isFocused()) {
            this.win.hide()
        } else {
            this.show()
        }
    }

    openInBrowser(e, url) {
        console.log(url)
        if (new RegExp(deeplinkUrls.join('|')).test(url)) {
            // Default action - if the user wants to open mail in a new window - let them.
        }
        else if (new RegExp(outlookUrls.join('|')).test(url)) {
            // Open calendar, contacts and tasks in the same window
            e.preventDefault()
            this.loadURL(url)
        }
        else {
            // Send everything else to the browser
            e.preventDefault()
            shell.openExternal(url)
        }
    }

    show() {
        this.win.show()
        this.win.focus()
    }
}

module.exports = MailWindowController
