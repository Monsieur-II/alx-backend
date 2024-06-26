import sinon from 'sinon';
import { expect } from 'chai';
import { createQueue } from 'kue';
import createPushNotificationsJobs from './8-job.js';

describe('createPushNotificationsJobs', () => {
  const BIG_BROTHER = sinon.spy(console);
  const QUEUE = createQueue({ name: 'push_notification_code_test' });

  before(() => {
    QUEUE.testMode.enter(true);
  });

  after(() => {
    QUEUE.testMode.clear();
    QUEUE.testMode.exit();
  });

  afterEach(() => {
    BIG_BROTHER.log.resetHistory();
  });

  it('throws an error if jobs is not an array', () => {
    expect(() => {
      createPushNotificationsJobs({}, QUEUE);
    }).to.throw('Jobs is not an array');
  });

  it('creates and saves jobs to the queue with the correct type and data', () => {
    const jobInfos = [
      {
        phoneNumber: '44556677889',
        message: 'Use the code 1982 to verify your account',
      },
      {
        phoneNumber: '98877665544',
        message: 'Use the code 1738 to verify your account',
      },
    ];

    createPushNotificationsJobs(jobInfos, QUEUE);

    expect(QUEUE.testMode.jobs.length).to.equal(2);
    expect(QUEUE.testMode.jobs[0].data).to.deep.equal(jobInfos[0]);
    expect(QUEUE.testMode.jobs[0].type).to.equal('push_notification_code_3');
  });

  it('logs a message when a job is created', () => {
    const jobInfos = [
      {
        phoneNumber: '44556677889',
        message: 'Use the code 1982 to verify your account',
      },
    ];

    createPushNotificationsJobs(jobInfos, QUEUE);

    QUEUE.testMode.jobs[0].emit('enqueue');

    expect(
      BIG_BROTHER.log.calledWith(
        `Notification job created: ${QUEUE.testMode.jobs[0].id}`
      )
    ).to.be.true;
  });

  it('logs a message when a job is completed', () => {
    const jobInfos = [
      {
        phoneNumber: '44556677889',
        message: 'Use the code 1982 to verify your account',
      },
    ];

    createPushNotificationsJobs(jobInfos, QUEUE);

    QUEUE.testMode.jobs[0].emit('complete');

    expect(
      BIG_BROTHER.log.calledWith(
        `Notification job ${QUEUE.testMode.jobs[0].id} completed`
      )
    ).to.be.true;
  });

  it('logs a message when a job fails', () => {
    const jobInfos = [
      {
        phoneNumber: '44556677889',
        message: 'Use the code 1982 to verify your account',
      },
    ];

    createPushNotificationsJobs(jobInfos, QUEUE);

    QUEUE.testMode.jobs[0].emit('failed', new Error('Failed to send'));

    expect(
      BIG_BROTHER.log.calledWith(
        `Notification job ${QUEUE.testMode.jobs[0].id} failed: Failed to send`
      )
    ).to.be.true;
  });

  it('logs a message when a job makes progress', () => {
    const jobInfos = [
      {
        phoneNumber: '44556677889',
        message: 'Use the code 1982 to verify your account',
      },
    ];

    createPushNotificationsJobs(jobInfos, QUEUE);

    QUEUE.testMode.jobs[0].emit('progress', 25);

    expect(
      BIG_BROTHER.log.calledWith(
        `Notification job ${QUEUE.testMode.jobs[0].id} 25% complete`
      )
    ).to.be.true;
  });
});
