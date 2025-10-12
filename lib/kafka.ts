import { Kafka, Producer, Consumer } from 'kafkajs';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'corporate-agent-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

let producer: Producer | null = null;
let consumer: Consumer | null = null;

export async function getProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
}

export async function getConsumer(): Promise<Consumer> {
  if (!consumer) {
    consumer = kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'corporate-agent-group',
    });
    await consumer.connect();
  }
  return consumer;
}

export async function publishToKafka(topic: string, message: any) {
  try {
    const producer = await getProducer();
    await producer.send({
      topic,
      messages: [
        {
          key: message.id || Date.now().toString(),
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
        },
      ],
    });
    console.log(`Message published to topic: ${topic}`);
  } catch (error) {
    console.error('Kafka publish error:', error);
    throw error;
  }
}

export async function subscribeToTopics(
  topics: string[],
  messageHandler: (topic: string, message: any) => Promise<void>
) {
  try {
    const consumer = await getConsumer();
    
    await consumer.subscribe({
      topics,
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          if (value) {
            const data = JSON.parse(value);
            await messageHandler(topic, data);
          }
        } catch (error) {
          console.error('Message processing error:', error);
        }
      },
    });

    console.log(`Subscribed to topics: ${topics.join(', ')}`);
  } catch (error) {
    console.error('Kafka subscribe error:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (producer) await producer.disconnect();
  if (consumer) await consumer.disconnect();
});

// Event Handlers for Kafka Topics
export const kafkaEventHandlers = {
  'session.updated': async (data: any) => {
    console.log('Session updated:', data);
    // Update local cache or notify affected agents
    // Send notifications to agents with appointments in this session
  },
  
  'doctor.availability.changed': async (data: any) => {
    console.log('Doctor availability changed:', data);
    // Update doctor availability in cache
    // Notify agents booking this doctor
  },
  
  'appointment.cancelled': async (data: any) => {
    console.log('Appointment cancelled:', data);
    // Update local appointment status
    // Send notification to agent
  },
};

// Start Kafka Consumer (call this in your app startup)
export async function startKafkaConsumer() {
  await subscribeToTopics(
    [
      'session.updated',
      'doctor.availability.changed',
      'appointment.cancelled',
      'payment.status.changed',
    ],
    async (topic, message) => {
      const handler = kafkaEventHandlers[topic as keyof typeof kafkaEventHandlers];
      if (handler) {
        await handler(message);
      }
    }
  );
}