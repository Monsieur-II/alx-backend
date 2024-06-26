import { createQueue } from 'kue';

const queue = createQueue({ name: 'push_notification_code' });

var jobData = {
  phoneNumber: '0500000000',
  message: 'This is the code to verify your account',
};

const job = queue.create('push_notification_code', jobData);

job.save((err) => {
  if (!err) console.log(`Notification job created: ${job.id}`);
});

job.on('complete', () => {
  console.log('Notification job completed');
});

job.on('failed', () => {
  console.log('Notification job failed');
});
