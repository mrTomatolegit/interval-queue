/**
 * @typedef {{
 *      awaitLastQueue: boolean;
 *      startTimer: 'after' | 'before';
 *      loop: boolean;
 *      timerForFirst: boolean;
 *  }} IntervalQueueOptions
 * @typedef {[() => any, any[]]} QueuedFunction
 */

/**
 * Runs the added functions every `intervalTime`ms by order of addition
 * @example ```js
 *  const queue = new IntervalQueue() // Uses default (2000ms)
 *  queue.add(() => console.log('foo')) // Will run immediately
 *  queue.add(() => console.log('bar')) // Will run 2s later
 * ```
 */
class IntervalQueue {
    /**
     *
     * @param {number} intervalTime The duration of the trigger timer
     * @param {IntervalQueueOptions} options Options for this queue
     */
    constructor(intervalTime = 2000, options = {}) {
        /**
         * The duration of the trigger timer
         * @type {number}
         */
        this.intervalTime = intervalTime;

        /**
         * Whether there is already a trigger loop ongoing
         * @type {boolean}
         */
        this.isTriggering = false;

        /**
         * All the queued functions
         * @type {QueuedFunction[]}
         */
        this.queue = [];

        /**
         * The list of promises that will resolve once the function output is resolved
         * @type {Promise<any>[]}
         */
        this.returnPromises = [];

        /**
         * The result of the last queued function
         * @type {any | Promise<any>}
         */
        this.lastFnResult = null;

        /**
         * Options for this queue
         * @type {IntervalQueueOptions}
         */
        this.options = {
            awaitLastQueue: options.awaitLastQueue ?? true,
            startTimer: options.startTimer || 'before',
            loop: options.loop || false,
            timerForFirst: options.timerForFirst || false
        };

        /**
         * If the queue was stopped because it was empty or it was paused, this will be true
         * @type {boolean}
         */
        this.isFirst = true;

        /**
         * If the queue is paused
         * @type {boolean}
         */
        this.paused = false;

        /**
         * The next trigger loop timeout
         *
         * (Clearing without setting `isTriggering` to `false` this will break the queue)
         * @private
         */
        this._currentTimeout = null;
    }

    /**
     * Adds a function and it's args to the queue
     * @param {() => any} fn
     * @param  {...any} args
     */
    add(fn, ...args) {
        this.queue.push([fn, [...args]]);
        const p = this._createResultPromise();
        this.returnPromises.push(p);
        this.trigger();
        return p;
    }

    /**
     * Changes the waiting time between each trigger
     * @param {number} time
     */
    setIntervalTime(time) {
        this.intervalTime = time;
        this.runNext();
    }

    /**
     * Runs the next function in the queue
     * @private
     */
    async trigger() {
        if (this.paused) return;
        if (this.isTriggering) return; // If a loop is already started, don't start again
        if (this.queue.length == 0) return void (this.isFirst = true); // If there is no function to run, stop

        this.isTriggering = true;
        if (this.options.timerForFirst && this.isFirst) return void this._createTimeout();

        if (this.options.awaitLastQueue && this.lastFnResult instanceof Promise)
            await this.lastFnResult.catch(() => {}); // Waits for last promise to resolve or reject

        const queued = this.queue.shift(); // Get next function to run and it's args
        const promise = this.returnPromises.shift();
        const fn = queued[0];
        const args = queued[1];
        if (this.options.loop) this.add(fn, ...args);

        this.lastFnResult = fn(...args); // Run the function and save the result

        if (this.lastFnResult instanceof Promise) {
            this.lastFnResult.then(x => promise.resolve(x)).catch(e => promise.reject(e));
        } else {
            promise.resolve(this.lastFnResult);
        }

        if (this.options.startTimer === 'after' && this.lastFnResult instanceof Promise) {
            this.lastFnResult.finally(() => this._createTimeout()); // Creates the timeout after resolve
        } else {
            this._createTimeout(); // Creates the timeout before resolve
        }
    }

    /**
     * Creates the timeout to loop trigger()
     * @private
     * @returns {NodeJS.Timeout}
     */
    _createTimeout() {
        this.isFirst = false;
        this._currentTimeout = setTimeout(() => {
            this.isTriggering = false;
            this.trigger();
        }, this.intervalTime);
        return this._currentTimeout;
    }

    /**
     * Creates the promise to return a result to the adder
     * @private
     * @returns {Promise<any>}
     */
    _createResultPromise() {
        let resolve;
        let reject;
        const p = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        p.resolve = resolve;
        p.reject = reject;
        return p;
    }

    /**
     * Stops the trigger loop
     */
    clearLoop() {
        clearTimeout(this._currentTimeout);
        this.isTriggering = false;
    }

    /**
     * Forces the next trigger to run immediately
     */
    runNext() {
        this.clearLoop();
        this.trigger();
    }

    /**
     * Pauses the queue (new functions will not be run)
     */
    pause() {
        this.paused = true;
        this.isFirst = true;
        this.clearLoop();
    }

    /**
     * Unpauses the queue (new functions will be run)
     */
    unpause() {
        this.paused = false;
        this.trigger();
    }
}

module.exports = IntervalQueue;
