Bundle = {
  Defaults: {
    // Convenience functions to reference various important divs within the build.
    // If you structure your HTML differently than our example build, you can alter these
    // functions to reference the correct divs.
    getBundleDiv: function() {
      return $('.bundle');
    },
    getBundleGridDiv: function() {
      return Bundle.Defaults.getBundleDiv().find('.bundle-grid');
    },
    getBundleDetailsDiv: function() {
      return Bundle.Defaults.getBundleDiv().find('.bundle-details');
    },
    getAddToCartDiv: function() {
      return $('#bundle-add-to-cart');
    },
    getProduct: function() {
      return ReCharge.products[0];
    },
  },
  Utils: {
    // Utility functions used throughout the rest of the build
    generateGuid: function() {
      // Generates a unique guid to be used for the bundle_id
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    calculateBundleQuantity: function($bundle) {
      // Calculates the total number of items selected on the page.
      // Will loop through all grid items and sum up the total bundle
      // quantity based on the data-qty attribute of each variant.
      // 1.) $bundle = top level bundle div of the grid matrix
      var bundle_qty = 0;
      $bundle.find('.bundle-item').each(function() {
        bundle_qty += Number($(this).attr('data-qty'));
      });
      return bundle_qty;
    },
    isSubscription: function(product) {
      // Determines whether the user has selected the One-time purchase
      // or Subscribe and Save option on the ReCharge widget
      return product.options.purchaseType == 'autodeliver' ? true : false;
    },
    updateBundleQuantity: function($item, increment) {
      // Main function to handle quantity manipulation. Pass in the grid
      // item along with the quantity to increment or decrement. Then it will
      // determine the current and new item/bundle quantities. Then it checks
      // constraints, and if valid, update all necessary data attributes,
      // interface output, and enable/disable any buttons.
      // 1.) $item = the clicked plus or minus .bundle-item parent div
      // 2.) increment = the amount to increase or decrease the quantity
      // Get bundle parent reference and min/max numbers
      var $bundle_placeholder = 'https://cdn.shopify.com/s/files/1/0248/8084/0813/files/level-icon-placeholder.png?v=1598028464';
      var $bundle_placeholder_last = 'https://cdn.shopify.com/s/files/1/0248/8084/0813/files/level-icon-placeholder_3.png?v=1598379943';
      var $bundle = $item.closest('.bundle-grid');
      var bundle_handle = $item.find('.bundle-handle').text();
      var bundle_title = $item.find('.bundle-title').text();
      var bundle_image = $item.find('img').attr('src');
      var bundle_min = Number($bundle.attr('data-bundle-min'));
      var bundle_max = Number($bundle.attr('data-bundle-max'));
      var bundle_initial = $item.find('.initial-add').attr("class");
      // Calculate current item and bundle quantity
      var bundle_qty = Bundle.Utils.calculateBundleQuantity($bundle);
      var item_qty = Number($item.attr('data-qty'));
      // Calculate the new bundle and item quantities with the increment added
      var new_bundle_qty = bundle_qty + increment;
      var new_item_qty = item_qty + increment;
      // Check constraints to make sure we can perform the action
      if (Bundle.Constraints.isItemGreaterThanZero(new_item_qty) &&
          Bundle.Constraints.isBundleGreaterThanMin(new_bundle_qty, bundle_min) &&
          Bundle.Constraints.isBundleLessThanMax(new_bundle_qty, bundle_max)) {
        //Update quantities and price
        $item.attr('data-qty', new_item_qty);
        $item.find('.quantity').html(new_item_qty);
        $('.bundle-details .current-qty').html(new_bundle_qty);
        Bundle.Utils.updatePrice();
        //Toggle the Add to Cart Button if max items is reached
        var is_disabled = Bundle.Constraints.isBundleEqualMax(new_bundle_qty, bundle_max) ? false :
        true;
        Bundle.Defaults.getAddToCartDiv().prop('disabled', is_disabled);
        //Update plus/minus button's disabled property
        $bundle.find('.bundle-item').each(function() {
          var item_qty = $(this).attr('data-qty');
          var is_disabled = Bundle.Constraints.isBundleEqualParam(new_bundle_qty, bundle_max) ? true :
          false;
          $(this).find('.plus').find('.btn').prop('disabled', is_disabled);
          $(this).find('.initial-add').find('.btn').prop('disabled', is_disabled);
          var is_disabled = Bundle.Constraints.isBundleEqualParam(new_bundle_qty, bundle_min) ||
              Bundle.Constraints.isBundleEqualParam(item_qty, 0) ? true : false;
          $(this).find('.minus').find('.btn').prop('disabled', is_disabled);
        });
      }
      
      if (increment > 0) {
        if (new_bundle_qty <= 1) {
      		$('.bundle-images').prepend('<div class="not_bundle_placeholder ' + bundle_handle + ' grid__item small--one-quarter medium-up--one-quarter"><a class="remove-image" data-product-handle="' + bundle_handle + '"></a><img src="' + bundle_image + '" /><h6>' + bundle_title + '</h6></div>')
        } else if (new_bundle_qty == 3) {
      		$('<div class="not_bundle_placeholder ' + bundle_handle + ' grid__item small--one-quarter medium-up--one-quarter"><a class="remove-image" data-product-handle="' + bundle_handle + '"></a><img src="' + bundle_image + '" /><h6>' + bundle_title + '</h6></div>').insertAfter($('.bundle-images').parent().find('.not_bundle_placeholder').last());
            var bundle_image_qty = 0;
            $('.bundle-images').children('div').each(function(i) { 
                if ($(this).hasClass('bundle_placeholder') && bundle_image_qty == 0) {
                  	$(this).remove();
                    $('.bundle-images').append('<div class="bundle_placeholder grid__item small--one-quarter medium-up--one-quarter"> <img src="' + $bundle_placeholder + '"><h6>Select Box</h6></div>')
                    bundle_image_qty = 1;
                }
            });
        } else {
         	$('<div class="not_bundle_placeholder ' + bundle_handle + ' grid__item small--one-quarter medium-up--one-quarter"><a class="remove-image" data-product-handle="' + bundle_handle + '"></a><img src="' + bundle_image + '" /><h6>' + bundle_title + '</h6></div>').insertAfter($('.bundle-images').parent().find('.not_bundle_placeholder').last());
        }
        var bundle_image_qty = 0;
        $('.bundle-images').children('div.bundle_placeholder').each(function(i) { 
            if (bundle_image_qty == 0) {
              	$(this).remove();
              	bundle_image_qty = 1;
            }
        });
      } else {
        var bundle_image_qty = 0;
        $('.bundle-images').children('div').each(function(i) { 
            if ($(this).hasClass(bundle_handle) && bundle_image_qty == 0) {
              	$(this).remove();
              	if (new_bundle_qty < 3) {
                    $('<div class="bundle_placeholder grid__item small--one-quarter medium-up--one-quarter"> <img src="' + $bundle_placeholder + '"><h6>Select Box</h6></div>').insertBefore($('.bundle-images').parent().find('.bundle_placeholder').last());
                } else {
                  	$('.bundle-images').append('<div class="bundle_placeholder grid__item small--one-quarter medium-up--one-quarter"> <img src="' + $bundle_placeholder + '"><h6>Select Box</h6></div>')
                }
              	bundle_image_qty = 1;
            }
        });
      }
      
      if (new_bundle_qty == 1) {
      	  $('#bundle-add-to-cart .cart-text').text('- Select 1 MORE Box');
      } else if (new_bundle_qty == 0) {
          $('#bundle-add-to-cart .cart-text').text('Select 2 Boxes');
		  $('#bundle-add-to-cart .bundle-price').text('');
      } else {
       	  $('#bundle-add-to-cart .cart-text').text('- Add to Cart');
      }
      
      if (new_item_qty == 1) {
      	  $item.find('.initial-add').hide();
      } else if (new_item_qty == 0) {
          $item.find('.initial-add').show();
      } else {
       	  //Do nothing 
      }
      
    },
    updatePrice: function() {
      // Main function to update price div within the .bundle-details class div.
      // Function will loop through all grid items and grab their qty and variant_id.
      // Then it uses the ReCharge object to determine the correct price based on
      // which purchase type the user has selected (One-time purchase or Subscribe & Save).
      // Based on purchase type, function will multiple the appropriate price by quantity
      // and sum all prices together to generate a total price. This price is then
      // output to the .bundle-price div.
      // Get bundle parent and product references
      var $bundle = Bundle.Defaults.getBundleGridDiv();
      var product = Bundle.Defaults.getProduct();
      // Determine whether the user has the One-time purchase or
      // Subscribe & Save purchase type option selected
      var is_subscription = Bundle.Utils.isSubscription(product);
      var price = 0;
      var realprice = 0;
      // Loop through all product grid items
      $bundle.find('.bundle-item').each(function() {
        // If grid item's quantity is above 0, use ReCharge
        // object to determine price and multiple by quantity
        var qty = Number($(this).attr('data-qty'));
        if (qty > 0) {
          var variant_id = $(this).attr('data-variant-id');
          var variant_price = product.variant_to_price[variant_id];
          console.log(variant_price);
          var correct_price = (Number(variant_price) / 100);
          var sub_price = correct_price - (correct_price * 0.15);
          if (is_subscription) {
            var duplicate_variant_id = product.variant_to_duplicate[variant_id];
            variant_price = product.duplicate_to_price[duplicate_variant_id];
          }
          price += qty * (Number(variant_price) / 100);
          realprice += qty * sub_price;
          console.log(realprice);
        }
      });
      // Format price into currency and output to .bundle-price div
      var $details = Bundle.Defaults.getBundleDetailsDiv();
      var formatted_price = (price).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });
      $details.find('.bundle-price').html(formatted_price);
    },
  },
  Constraints: {
    // Requirement functions to determine whether the user is
    // performing an action that is forbidden
    isItemGreaterThanZero: function(qty) {
      // Check that the item quantity doesn't fall below zero
      // 1.) qty = item quantity of the variant
      if (qty < 0) {
        console.log('Item quantity cannot be less than 0.');
        return false;
      }
      return true;
    },
    isBundleGreaterThanMin: function(qty, min) {
      // Check that the bundle quantity doesn't fall below the minimum quantity
      // 1.) qty = total bundle quantity of the page
      // 2.) min = minimum value the bundle quantity can't fall below
      if (qty < min) {
        console.log('Quantity cannot be less than the minimum.');
        return false;
      }
      return true;
    },
    isBundleLessThanMax: function(qty, max) {
      // Check that the bundle quantity doesn't go above the maximum quantity
      // 1.) qty = total bundle quantity of the page
      // 2.) max = maximum value the bundle quantity can't rise above
      if (qty > max) {
        console.log('Quantity cannot be greater than maximum.');
        return false;
      }
      return true;
    },
    isBundleEqualMax: function(qty, max) {
      // Check that the bundle quantity is equal to the maximum quantity
      // 1.) qty = total bundle quantity of the page
      // 2.) max = maximum value the bundle quantity can't rise above
      return qty > 1 ? true : false;
    },
    isBundleEqualParam: function(qty, param) {
      // Check that the bundle quantity is equal to param
      // 1.) qty = total bundle quantity of the page
      // 2.) param = value to compare qty against
      return qty == param ? true : false;
    },
  },
  Cart: {
    // Functions used when adding the bundle to the cart
    processAddToCart: function() {
      // Top level function tied to the Add to Cart button.
      // Function will check constraints to make sure we can
      // add the bundle to the cart, then it will generate
      // the cart array and make the AJAX call to Shopify's API.
      // Once added to cart, we redirect to the /cart page.
      // Get bundle parent, bundle max value, and total bundle quantity values
      var $bundle = Bundle.Defaults.getBundleGridDiv();
      var qty = Bundle.Utils.calculateBundleQuantity($bundle);
      var bundle_max = Number($bundle.attr('data-bundle-max'));
      // Ensure we can process the cart, and if not, break out of function
      if (!Bundle.Constraints.isBundleEqualMax(qty, bundle_max)) {
        console.log('Cannot process Add to Cart. Qty does not equal max total.');
        return;
      }
      //Generate the product array to pass to AJAX call
      var product = Bundle.Defaults.getProduct();
      var items = Bundle.Cart.generateCart($bundle, product);
      // Ensure there are items to add to cart, and if so, make
      // API call and redirect to /cart page
      if (items.length > 0) {
        Bundle.Cart.processToCart(items);
      } else {
        console.log('No items available to add to cart.');
      }
    },
    generateCart: function($bundle, product) {
      // Check that the bundle quantity is equal to param
      // 1.) $bundle = top level bundle div of the grid matrix
      // 2.) product = the ReCharge product object tied to the page
      var cart = [];
      var is_subscription = Bundle.Utils.isSubscription(product);
      // bundle_id that we will pass to each product object as a
      // line item property to associate them to this bundle
      var bundle_id = Bundle.Utils.generateGuid();
      // Determine whether the user has the One-time purchase or
      // Subscribe & Save purchase type option selected. If Subscribe
      // & Save, generate the shipping interval unit_type and frequency
      // that are passed through on ReCharge orders.
      if (is_subscription) {
        var shipping_interval_unit_type = $('#rc_container [name = "properties[shipping_interval_unit_type]"]').val();
                                            var shipping_interval_frequency = $('#rc_container [name = "properties[shipping_interval_frequency]"]').val();
                                            }
                                            // Loop through each product grid item
                                            $bundle.find('.bundle-item').each(function() {  
          // If item's quantity is greater than 0, add
          // to the cart array
          var qty = $(this).attr('data-qty');
          if (Number(qty) > 0) {
            var variant_id = $(this).attr('data-variant-id');
            // Pass the variant_id, quantity, and bundle_id
            // for each grid item we process
            var item = {
              id: variant_id,
              quantity: qty,
              properties: {
                bundle_id: bundle_id,
              }
            }
            // If this is a Subscribe & Save bundle, pass in the
            // ReCharge properties too
            if (is_subscription) {
              item['id'] = product.variant_to_duplicate[variant_id];
              item['properties']['shipping_interval_unit_type'] = shipping_interval_unit_type;
              item['properties']['shipping_interval_frequency'] = shipping_interval_frequency;
            }
            cart.push(item)
          }
        });
        return cart;
      },
        processToCart: function(items) {
          // Makes API call to add bundle items to cart. If the
          // call is successful, redirect to /cart page. If error,
          // display the error to the console.
          // 1.) items = the product array to be passed to the Shopify
          // API. Bundle.Cart.generateCart() function builds this array.
          $.ajax({
            type: 'POST',
            url: '/cart/add.js',
            data: {
              'items': items,
            },
            dataType: 'json',
            success: function() {
              window.location.href = '/cart';
            },
            error: function(jqXHR, text_status, error_thrown) {
              console.log(text_status, error_thrown);
            },
          });
        },
    },
    init: function() {
      // Initialization function to register all click handlers
      // Registers each grid item's minus button
      $('body').on('click', '.bundle .minus', function() {
        var item = $(this).closest('.bundle-item');
        Bundle.Utils.updateBundleQuantity(item, -1);
      });
      // Registers each grid item's plus button
      $('body').on('click', '.bundle .plus', function() {
        var item = $(this).closest('.bundle-item');
        Bundle.Utils.updateBundleQuantity(item, 1);
      });
      
      // Registers each grid item's plus initial button
      $('body').on('click', '.initial-add .btn', function() {
        var item = $(this).closest('.bundle-item');
        Bundle.Utils.updateBundleQuantity(item, 1);
      });
      
      // Registers each grid item's plus initial button
      $('body').on('click', 'a.remove-image', function() {
        var producthandle = $(this).attr('data-product-handle');
        $('.bundle-items .bundle-grid').children('.grid__item.bundle_product').each(function(i) { 
          	var bundlegridhandle = $(this).attr('data-product-handle');
          	var item = $(this).find('.bundle-item');
          	if( producthandle == bundlegridhandle ) {
        		Bundle.Utils.updateBundleQuantity(item, -1);
            } else {
             	//do nothing
            }
            
        });
      });

      // Registers the page's Add to Cart button
      $('body').on('click', '#bundle-add-to-cart', function() {
        event.preventDefault();
        Bundle.Cart.processAddToCart();
      });
      // Registers function to handle pricing changes when the
      // user changes the purchase type
      $('body').on('change', '#rc_radio_options input[name="purchase_type"]', function() {
        Bundle.Utils.updatePrice();
      });
      // Bit of a hack. Formats the purchase type options so they do
      // not show the semi-colon that is normally used when displaying
      // price on each purchase type option
      $('.rc_label').each(function() {
        var html_string = $(this).html();
        var new_string = html_string.replace(':', '');
        $(this).html(new_string);
      });
    },
  }
  
  // Call the init() function to register click handlers
  Bundle.init();