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

## Client Side Rendering

In the client side rendered case, what's sent to the browser is far more complex and varies significantly framework to framework. But from an extremely high level it would look like this

```javascript
const e1 = document.createElement('div');
const e2 = document.createElement('p');
e2.innerHTML = 'First name:';
const e3 = document.createElement('p');
e3.innerHTML = 'Ruben';
...
document.body.appendChild(e1);
e1.appendChild(e2);
e1.appendChild(e3);
...
```

## Performance

Already, even with this small example, we have enough to reason about the performance implications.