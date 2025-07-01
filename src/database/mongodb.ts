import mongoose from 'mongoose';
import { config } from '../config/app.config';
import chalk from 'chalk';
import logger from '../common/utils/logger';

const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log(chalk.greenBright('Connect to Mongo Database'));
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.info(
          `MongoDB ${collectionName}.${method}(${JSON.stringify(query)}, ${JSON.stringify(doc)})`,
        );
      });
    }
  } catch (error) {
    console.log(chalk.red.bold('Error connecting to Mongo Database'));
    process.exit(1);
  }
};

export default connectToDatabase;
