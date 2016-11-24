# libsyn-stat-scraper
An Azure Function to get stats from Libsyn in JSON

## The Problem

To make a long story short, I'm creating a Power BI dashboard that lets us track statistics about the MS Dev Show automatically. We pull in data from our analytics system, from a stats database that Channel 9 maintains, and Libsyn - our podcast host.

Unfortunately, Libsyn doesn't have an API. They do have some nice reporting dashboards, and they do a great job of always including a button to export their stats to CSV. We can certainly download this and bring it into Power BI, but that's a lot of manual work.

I've been a little obsessed with Azure Functions recently. If you're not familiar with Azure Functions, it's a simplistic service that lets you write and execute code without managing servers. You can write some code in your favorite language, right in your browser, and have it execute on a schedule, with a web call, Event Hub message, etc. If this sounds over-complicated, you're probably overthinking it.

## The Solution

In short, we'll create an Azure function that uses an HTTP trigger which assigns it a URL. In our function, we'll log into Libsyn, download the CSV, reformat it, and pass it back to the original caller.

    +----------+    +----------+    +--------+
    | Power BI +----> Azure    +----> Libsyn |
    |          <----+ Function <----+ Libsyn |
    +----------+    +----------+    +--------+

Here is a simplified Azure Function showing how we can proxy a page:

    module.exports = function (context, req) {
        let req = http.get('http://foo.com', (res) => {
            let responseText = '';

            res.on('data', (chunk) => {
                responseText += chunk;
            });
            res.on('end', () => {
                 let functionResponse = {
                    status: 200,
                    body: responseText
                }
                context.done(null, functionResponse);  
            };
        }
        req.end();
    }

Most of this is typical Node.js code. The special glue for Azure Functions is the `context` object. Since this code is asynchronous, `context.done` is the method we call to signal to Azure Functions that we're done executing.

## Saving Cookies

The login request gives us back cookies to keep us logged in, we'll need to save those for subsequent requests:

    let cookies = answer.headers['set-cookie'];

And in our next request we'll pass those in a header:

    'Cookie': cookies.join(";")

## Finishing

All that's left to do is request the data, and pass it back to the original requestor.

    context.done(null, res);