import { Router } from "express";

import { authCheck } from "../middlewares/authCheck.js";
import { validateCreateSubscription, validateUpdateSubscription } from "../validators/subscriptionValidator.js";
import { checkSubscription, createSubscription, deleteSubscription, getMySubscriptions, getSubscriptionById, toggleSubscriptionStatus, updateSubscription } from "../controllers/subscription.js";
import { validate } from "../middlewares/validate.js";



const subscription = Router();

// Apply authentication middleware to all routes
subscription.use(authCheck);

subscription.post('/', validateCreateSubscription, validate, createSubscription);
subscription.get('/', getMySubscriptions);
//check if subscribed to a company
subscription.get('/check/:companyId', checkSubscription);
//get subscription id
subscription.get('/:id', getSubscriptionById);
//update subscription
subscription.patch('/:id', validateUpdateSubscription, validate, updateSubscription);
//toggle subscription status
subscription.patch('/:id/toggle', toggleSubscriptionStatus);
//delete subscription
subscription.delete('/:id', deleteSubscription);

export default subscription;


