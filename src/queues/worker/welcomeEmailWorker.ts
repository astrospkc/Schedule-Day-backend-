import { Worker } from 'bullmq';
import redisConnection from '../../db/redisConnection.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const welcomeEmailWorker = new Worker(
    "welcomeEmailQueue",
    async (job) => {
        console.log(`Processing welcome email for ${job.data.email}`);

        try {
            const { data, error } = await resend.emails.send({
                from: 'DayMeetingScheduler <noreply@xastrosbuild.site>', // Make sure this domain is verified in your Resend dashboard
                to: [job.data.email],
                subject: 'Welcome to Our App!',
                html: `
                    <h1>Welcome to Our App, ${job.data.name}!</h1>
                    <p>We're excited to have you on board. Here's your welcome message:</p>
                    <p>${job.data.welcomeMessage || 'Thank you for joining us! We hope you enjoy using our service.'}</p>
                    <p>Best regards,<br/>The Team</p>
                `,
            });

            if (error) {
                console.error('Error sending welcome email:', error);
                throw error;
            }

            console.log(`Welcome email sent to ${job.data.email}`);
            return { success: true, messageId: data?.id };
        } catch (error) {
            console.error('Failed to send welcome email:', error);
            throw error; // This will mark the job as failed
        }
    },
    {
        connection: redisConnection
    }
);

welcomeEmailWorker.on('completed', (job) => {
    console.log(`✅ Welcome email job ${job.id} completed`);
});

welcomeEmailWorker.on('failed', (job, error) => {
    console.error(`❌ Welcome email job ${job?.id} failed:`, error);
});

// The worker is automatically started when this module is imported
export const welcomeEmailWorkerInstance = welcomeEmailWorker;
