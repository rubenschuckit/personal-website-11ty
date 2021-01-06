---
title: Should you render your site in the client or the server? ¿Porque no los dos?
date: 2021-01-06T04:43:51.140Z
summary: "\"History Doesn't Repeat Itself, but It Often Rhymes\" - Mark Twain"
tags:
  - post
---
Of the limited coding I did in college, none of it was front end. So when I became a newly-minted software engineer in industry, front end coding was completely new to me. Like many software engineers (and [memes](https://i.imgur.com/Q3cUg29.gif)) attest, I find making templates and *especially* styling them with CSS very difficult and annoying. The people who can elegantly use CSS to create stunning layouts are the true geniuses of our time, and I'm afraid I can't count myself among them. Still, I've found myself incredibly fascinated by what lingers beneath, namely front end frameworks. 

I can't pinpoint why this is, especially since I never did any front end programming before my first job. But if I had to guess, it's because of Angular. Fresh out of college, I had few practical design skills besides being able to...well write code. And [Angular](https://angular.io/) was (and continues to be) and opinionated framework that forced me down a path of good design practice and as such was able to help me build my design intuition. 

I mention all this because Angular is a client side framework. And since I had no previous front end experience, it was not until leaving my previous job and starting my new one that I learned frameworks need not take a client side rendered first approach. And this change has made me aware of the performance tradeoffs between client and server side rendering. But it also has let me notice an interesting pattern that has emerged. In the beginning, there was only server side rendering. Then client side rendering frameworks became the norm. And now client side frameworks are trying to become more server oriented.

# Client vs Server Side Rendering

When I was first trying to learn the difference between client and server side rendering, I was confused. Surely all rendering is done in the client, I thought. We don't ship JPGs of our site to browsers. We send HTML, CSS, and Javascript, which once arrived in the user's browser, renders itself into meaningful and hopefully properly placed pixels.  

This is the first sticking point in my mind. The process of painting the layout that I describe above is called rendering (and it can only happen in the client). But constructing the templates is also part of the rendering pipeline. In the context we're interested in, I like to think of client and server side rendering as client and server side composition of templates. That is, where is the HTML template composed? The client or the server? 

## Toy Example

In rich web apps, we use a lot of placeholders in our templates. For example, imagine an account information page that shows me me name, age, and email. The template pseudocode would look something like this

```html
<div>
  <p>First name:</p>
  <p>{{person.firstName}}</p>
  
  <p>Last name:</p>
  <p>{{person.lastName}}</p>
  
  <p>Email:</p>
  <p>{{person.email}}</p>
</div>
```

If this were sent to the browser as is, people would be confused why their first name is {{person.firstName}} and so on. So to fix this, we use front end frameworks that, in the most simple case, patch in relevant data.

## Server Side Rendering

I find it's easiest to discuss where the template is rendered by asking the question: What is sent to the browser? In the case of server side rendering, this will be sent to the browser

```html
<div>
  <p>First name:</p>
  <p>Ruben</p>
  
  <p>Last name:</p>
  <p>Schuckit</p>
  
  <p>Email:</p>
  <p>imnotstupidenoughtoputmyemailontheinternet@hotmail.com</p>
</div>
```

As you can see, the placeholders are already filled in. This is because the server rendered the template before it was sent to the client. All the client has to do at this point is paint the template. 

## Client Side Rendering

In the client side rendered case, what's sent to the browser is far more complex and varies significantly framework to framework. But from an extremely high level the template would look like this

```html
<div id="app"></div>
<script src="https://cdn.com/main.js"></script>
```

and an excerpt of main.js would look like

```javascript
const e1 = document.createElement('div');
const e2 = document.createElement('p');
e2.innerHTML = 'First name:';
const e3 = document.createElement('p');
e3.innerHTML = 'Ruben';
...
const root = document.getElementById('app');
root.body.appendChild(e1);
e1.appendChild(e2);
e1.appendChild(e3);
...
```

There's infinitely more complexity involved in client side rendering frameworks since they also manage state, event listeners, etc. But the main takeaway here is that JS is creating the template in the client, and the template sent to the client is not fully rendered. It's a shell or placeholder that the JS will fill. 

## Performance

Already, even with this small example, we have enough to reason about the performance implications. Which will render faster?

Hopefully you said the server rendered template. The reasons are both obvious and subtle. 

From a high level, the heavy lifting is taken care of by the server. It's put the template on a silver platter and sent it to the client. Now all the client has to do is paint it. Dead simple. 

In the client side rendered example, there's a lot of extra work to be done in the client. First, the template that is sent is empty, so the user doesn't see anything initially. Now it makes an additional network request for the JS bundle that includes the rendering instructions. Once it downloads the JS, it has to parse and execute it. Next, it has to make additional network calls to obtain the relevant data (first name, last name, etc.). Then, once all of this is complete, the template will be ready to paint.

In the server side rendered example, there is one network request and zero JS execution to paint the template. Imagine in the client side rendered example if you had a slow network connection. First you make a roundtrip to get the template. Once the browser reads the `script` tag, it will then make an additional network request for the JS bundle, which will be much larger than the template. Then when it's executing the JS it will come across other data fetches that result in even more network requests. Even with a fast connection, the servers that server side render templates are often colocated with the servers that possess the relevant data, or at least have a good internet connection. The entire flow is streamlined when templates are rendered on the server. 

## Ok, sounds like we should just always server side render? 

Well, not so fast. The vast marketshare of front end frameworks are client side (React, Vue, Angular, Ember,...). What's the benefit?