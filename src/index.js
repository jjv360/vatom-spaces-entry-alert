/**
 * This is the main entry point for your plugin.
 *
 * All information regarding plugin development can be found at
 * https://developer.vatom.com/plugins/plugins/
 *
 * @license MIT
 * @author Vatom Inc.
 */
export default class MyPlugin extends BasePlugin {

    /** Plugin info */
    static id = "jjv360.entry-notification"
    static name = "Entry Alert"

    /** Instance ID */
    instanceID = Math.random().toString(36).substring(2)

    /** Called on load */
    async onLoad() {

        // Register plugin settings
        this.menus.register({
            section: 'plugin-settings',
            panel: {
                fields: [

                    { type: 'section', name: 'General' },
                    { type: 'select', id: 'when-enters', name: 'When someone enters', values: ['Do nothing', 'Alert admins', 'Alert everyone'], help: "Select who gets to see entry notifications." },

                    { type: 'section', name: 'Sound' },
                    { type: 'checkbox', id: 'play-sound', name: 'Play a sound', help: "If enabled, a sound will be played when someone enters the space." },

                    { type: 'section', name: 'Notification' },
                    { type: 'checkbox', id: 'show-alert', name: "Show a notification", help: "If enabled, a toast notification will be displayed when someone enters the space." },
                    { type: 'checkbox', id: 'show-goto', name: 'Show Go To button', help: "If enabled, a 'Go To' button will be added to the toast notification to take you to that person."}

                ]
            }
        })

        // Preload sound effects
        this.audio.preload(absolutePath('./enter.wav'))

    }

    /** Called on entering the space */
    async onEnter() {

        // Send a notification to everyone
        this.isEntered = true
        this.messages.send({
            action: 'enter',
            username: await this.user.getDisplayName(),
            instanceID: this.instanceID
        }, true)

    }

    /** Called when the user presses the action button */
    async onMessage(msg, fromID) {

        // Ignore if it's our own message
        if (msg.instanceID == this.instanceID)
            return

        // We only handle 'enter' right now
        if (msg.action == 'enter')
            await this.onEnterMessage(msg, fromID)

    }

    /** Called when someone else enters the space */
    async onEnterMessage(msg, fromID) {

        // Ignore if we still haven't entered the space yet, ie we are on the Start Screen
        if (!this.isEntered)
            return

        // Check who sees the alerts
        let whenEnters = this.getField('when-enters') || 'Do nothing'
        if (whenEnters == 'Alert admins') {

            // Only continue if we're an admin
            let isAdmin = await this.user.isAdmin()
            if (!isAdmin)
                return

        } else if (whenEnters == 'Alert everyone') {

            // Everyone can be notified

        } else {

            // Do nothing
            return

        }

        // Check if should play a sound
        if (this.getField('play-sound')) {

            // Play a sound
            this.audio.play(absolutePath('./enter.wav'))

        }

        // Check if should show a toast
        if (this.getField('show-alert')) {

            // Show popup
            this.menus.toast({
                text: `<b>${msg.username}</b> has entered the space.`,
                buttonText: this.getField('show-goto') ? 'Go to' : null,
                buttonAction: this.getField('show-goto') ? e => this.goToUser(fromID) : null
            })

        }

    }

    /** Called when another instance of our plugin sends a request */
    async onRequest(request) {

        // Check what to do
        if (request.action == 'get-position') {

            // Reply with our position
            return await this.user.getPosition()

        }

    }

    /** Called when the user presses the Go To button in the toast */
    async goToUser(userID) {

        // Ask other user for their position
        console.debug(`[Entry Alert] Asking ${userID} for their position...`)
        let pos = await this.messages.request({ action: 'get-position' }, false, userID)
        
        // Choose a random point on a circle around this user
        let angle = Math.random() * Math.PI * 2
        let radius = Math.random() * 2 + 1
        let x = pos.x + Math.cos(angle) * radius
        let y = pos.y
        let z = pos.z + Math.sin(angle) * radius

        // Go to position
        await this.user.setPosition(x, y, z, false)

    }

}
