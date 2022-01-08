type IntervalQueueOptions = {
    awaitLastQueue: boolean;
    startTimer: 'after' | 'before';
    loop: boolean;
    timerForFirst: boolean;
};

type QueuedFunction = [() => any, any[]];

/**
 * Runs the added functions every `intervalTime`ms by order of addition
 * @example ```js
 *  const queue = new IntervalQueue() // Uses default (2000ms)
 *  queue.add(() => console.log('foo')) // Will run immediately
 *  queue.add(() => console.log('bar')) // Will run 2s later
 * ```
 */
declare class IntervalQueue {
    /**
     *
     * @param intervalTime The duration of the trigger timer
     * @param options Options for this queue
     */
    constructor(intervalTime: number, options: IntervalQueueOptions);

    /**
     * The duration of the trigger timer
     */
    public intervalTime: number;

    /**
     * Whether there is already a trigger loop ongoing
     */
    public isTriggering: boolean;

    /**
     * All the queued functions
     */
    public queue: QueuedFunction[];

    /**
     * The list of promises that will resolve once the function output is resolved
     */
    public returnPromises: Promise<any>[];

    /**
     * The result of the last queued function
     */
    public lastFnResult: any | Promise<any>;

    /**
     * Options for this queue
     */
    public options: IntervalQueueOptions;

    /**
     * If the queue was stopped because it was empty or it was paused, this will be true
     */
    public isFirst: boolean;

    /**
     * If the queue is paused
     */
    public paused: boolean;

    /**
     * The next trigger loop timeout
     *
     * (Clearing without setting `isTriggering` to `false` this will break the queue)
     */
    private _currentTimeout: ReturnType<typeof setTimeout>;

    /**
     * Adds a function and it's args to the queue
     * @param fn The function to add
     * @param  args The function's args
     */
    public add(fn: () => any, ...args: any): void;

    /**
     * Changes the waiting time between each trigger
     */
    public setIntervalTime(time: number): void;

    /**
     * Runs the next function in the queue
     */
    private trigger(): Promise<void>;

    /**
     * Creates the timeout to loop trigger()
     */
    private _createTimeout(): ReturnType<typeof setTimeout>;

    /**
     * Creates the promise to return a result to the adder
     */
    private _createResultPromise(): Promise<any>;

    /**
     * Stops the trigger loop
     */
    public clearLoop(): void;

    /**
     * Forces the next trigger to run immediately
     */
    public runNext(): void;

    /**
     * Pauses the queue (new functions will not be run)
     */
    public pause(): void;

    /**
     * Unpauses the queue (new functions will be run)
     */
    public unpause(): void;
}

export = IntervalQueue;
