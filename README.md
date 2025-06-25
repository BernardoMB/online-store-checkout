# online-store
Online store

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