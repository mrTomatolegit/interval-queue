const { test, expect, afterEach } = require('@jest/globals'); // Import to have the typing declarations
const IntervalQueue = require('../src/IntervalQueue');

const wait = ms => {
    return new Promise(res => {
        setTimeout(() => {
            res();
        }, ms);
    });
};

let queue = null;

afterEach(() => {
    queue.clearLoop();
    queue = null;
});

test('Triggers after period of time', async () => {
    queue = new IntervalQueue(2000);
    let dates = [];
    queue.add(() => dates.push(0));
    queue.add(() => dates.push(1));
    await wait(1000);
    expect(dates.length).toBe(1);
    await wait(1000);
    expect(dates.length).toBe(2);
});

test('Waits for promise to end before continuing (async)', async () => {
    queue = new IntervalQueue(2000, { awaitLastQueue: true, startTimer: 'before' });
    let exec2 = false;
    queue.add(async () => wait(3000));
    queue.add(() => (exec2 = true));
    expect(exec2).toBe(false);
    await wait(2050);
    expect(exec2).toBe(false);
    await wait(1000);
    expect(exec2).toBe(true);
});

test('Waits for promise to end before continuing (sync)', async () => {
    queue = new IntervalQueue(2000, { awaitLastQueue: true, startTimer: 'before' });
    let exec2 = false;
    queue.add(() => {});
    queue.add(() => (exec2 = true));
    expect(exec2).toBe(false);
    await wait(2050);
    expect(exec2).toBe(true);
});

test('Does not wait for promise to end before continuing', async () => {
    queue = new IntervalQueue(2000, { awaitLastQueue: false, startTimer: 'before' });
    let exec2 = false;
    queue.add(async () => wait(3000));
    queue.add(() => (exec2 = true));
    expect(exec2).toBe(false);
    await wait(2050);
    expect(exec2).toBe(true);
});

test('Starts next timer after first function resolves (async)', async () => {
    queue = new IntervalQueue(1000, { awaitLastQueue: false, startTimer: 'after' });
    let exec2 = false;
    queue.add(async () => wait(1000));
    queue.add(() => (exec2 = true));
    await wait(2000);
    expect(exec2).toBe(false);
    await wait(550);
    expect(exec2).toBe(true);
});

test('Starts next timer after first function resolves (sync)', async () => {
    queue = new IntervalQueue(2000, { awaitLastQueue: false, startTimer: 'after' });
    let exec2 = false;
    queue.add(() => {});
    queue.add(() => (exec2 = true));
    await wait(1000);
    expect(exec2).toBe(false);
    await wait(2050);
    expect(exec2).toBe(true);
});

test('Triggering without fn does nothing', () => {
    queue = new IntervalQueue(2000);
    queue.trigger();
});

test('Resetting timer prevents next trigger', async () => {
    queue = new IntervalQueue(500);
    let done = false;
    queue.add(() => {});
    queue.add(() => {
        done = true;
    });
    queue.clearLoop();
    await wait(550);
    expect(done).toBe(false);
});

test('runNext() runs next no matter the timer', () => {
    queue = new IntervalQueue(20000);
    let done = false;
    queue.add(() => {});
    queue.add(() => {
        done = true;
    });
    queue.runNext();
    expect(done).toBe(true);
});

test('Interval set to 0 runs immediately', async () => {
    queue = new IntervalQueue(0);
    let done = false;
    queue.add(() => {});
    await wait(1);
    queue.add(() => (done = true));
    expect(done).toBe(true);
});

test('timerForFirst', async () => {
    queue = new IntervalQueue(2000, { timerForFirst: true });
    let done = false;
    queue.add(() => {
        done = true;
    });
    expect(done).toBe(false);
    await wait(2050);
    expect(done).toBe(true);
});

test('loop', async () => {
    queue = new IntervalQueue(2000, { loop: true });
    let foo = false;
    queue.add(() => (foo = !foo));
    expect(foo).toBe(true);
    await wait(2050);
    expect(foo).toBe(false);
});

test('pause', async () => {
    queue = new IntervalQueue(500);
    let foo = false;
    queue.add(() => {});
    queue.pause();
    queue.add(() => (foo = true));
    await wait(1000);
    expect(foo).toBe(false);
    queue.unpause();
    expect(foo).toBe(true);
});

test('return promises (sync)', async () => {
    queue = new IntervalQueue();
    let foo;
    queue.add(() => 'foo').then(x => (foo = x));
    await wait(500);
    expect(foo).toBe('foo');
});

test('return promises (async)', async () => {
    queue = new IntervalQueue();
    let foo;
    queue
        .add(async () => {
            wait(500);
            return 'foo';
        })
        .then(x => (foo = x));
    expect(foo).toBe(undefined);
    await wait(750);
    expect(foo).toBe('foo');
});
