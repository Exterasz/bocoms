'use strict'

const rp = require('request-promise');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const { v4: uuidv4 } = require('uuid');

let deviceId = uuidv4();
const mulai = async () =>{
  try {  
    let file = readFile('userpass.txt', 'utf8');
    let data = {};
    let empass = (await file).split('\n');
    console.log('Number of accounts to be created : '+ empass.length);
    for(let i in empass){
      if(i%6 === 0){
        deviceId = uuidv4();
        await sleep(180000);
      }
      data['email'] = empass[i].split('|')[0];
      data['password'] = empass[i].split('|')[1];
      await main(data);
    }
  } catch(e) {
      console.log('Error:', e.stack);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const request = rp.defaults({
  baseUrl: 'https://iphone-xml.booking.com/json/',
  json: true,
  qs: {
    user_os: '8.0.0',
    user_version: '22.9-android',
    device_id: deviceId,
    network_type: 'wifi',
    languagecode: 'en-us',
    display: 'normal_xxhdpi',
    affiliate_id: 337862
  },
  headers: {
    'X-LIBRARY': 'okhttp+network-api',
    'Authorization': 'Basic dGhlc2FpbnRzYnY6ZGdDVnlhcXZCeGdN',
    'User-Agent': 'Booking.App/22.9 Android/8.0.0; Type: mobile; AppStore: google; Brand: google; Model: Android 8.0.0; SM-G960F Build/R16NW',
    'X-Booking-API-Version' :'1'
  }
})

const hotels = ['3326463', '4984319']

async function main(data) {
  try{
    const register = await request('mobile.createUserAccount', {
      method: 'POST',
      body: { ...data, return_auth_token: 1 }
    });
    console.log(register, data);
    const createWishList = await request('mobile.Wishlist', {
      qs: {
        wishlist_action: 'create_new_wishlist',
        auth_token: register.auth_token,
        name: 'Jakarta',
        hotel_id: '28250'
      }
    })
    console.log(`[+] Register Success | ${data.email}:${data.password}`)
  //   createWishList.success
    console.log(`[+] Claiming wallet...`);
    for (const id of hotels) {
      const saveWishList = await request('mobile.Wishlist', {
        qs: {
          'wishlist_action': 'save_hotel_to_wishlists',
          'list_ids': createWishList.id,
          'new_states': 1,
          'hotel_id': id,
          'list_dest_id': 'city%3A%3A-2679652',
          'update_list_search_config': 1,
          'checkin': '2020-06-30',
          'checkout': '2020-07-1',
          'num_rooms': 1,
          'num_adults': 2,
          'num_children': 0,
          auth_token: register.auth_token
        }
      })
      if (saveWishList.gta_add_three_items_campaign_status.status !== 'not_yet_reached_wishlist_threshold') {
          console.log(saveWishList.gta_add_three_items_campaign_status.modal_body_text, saveWishList.gta_add_three_items_campaign_status.modal_header_text)
      } 
    }
  } catch (error){
    // if(error.error.message === 'Authentication token is invalid, please login.'){
    //   return console.log('[-] Register Failed | Tunggu beberapa saat lagi');
    // }
    return console.log('[-] Register Failed | '+ error.error.message);
  }
}


mulai();