import { createQueue } from 'kue';

const blacklistedNumbers = ['4153518780', '4153518781'];

const queue = createQueue();

async function sendNotification(phoneNumber, message, job, done) {
  try {
    for (let i = 0; i < 2; i++) {
      job.progress(i, 2);
      if (blacklistedNumbers.includes(phoneNumber)) {
        done(new Error(`Phone number ${phoneNumber} is blacklisted`));
        return;
      }
      if (i < 1) {
        console.log(
          `Sending notification to ${phoneNumber}, with message: ${message}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    done();
  } catch (error) {
    done(error);
  }
}

// Process 2 jobs at a time
queue.process('push_notification_code_2', 2, (job, done) => {
  sendNotification(job.data.phoneNumber, job.data.message, job, done);
});
