# online-store-checkout
Online store Checkout Lambda

This a Lambda function to create Stipe's Checkout session. This functions returns the Stripe's session ID that later on is used by Stripe's React JS SDK on the client side to redirect the user to the Stripe Checkout site.

# Deploy
To deploy this code see the following instruction: 
Zip the folder containing all the code from the repository.

Deploy your zip file containing your code with the following command
```bash
aws lambda update-function-code --function-name {functionname} --zip-file fileb://{zipfilename}
```
Example
```bash
aws lambda update-function-code --function-name OnlineStoreCheckout --zip-file fileb://checkout-lambda.zip
```