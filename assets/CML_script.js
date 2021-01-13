if(window.jQuery)  init();
else{
    var script = document.createElement('script');
    document.head.appendChild(script);
    script.type = 'text/javascript';
    script.src = "https://code.jquery.com/jquery-3.2.1.js";
    script.onload = init;
}

function init(){
    if (typeof Shopify.getCart === "undefined" || typeof Shopify.getCart === undefined) {
        Shopify.getCart = function (t) {
            jQuery.getJSON("/cart.js", function (r) {
                if ("function" == typeof t)
                    t(r);
            })
        };
    }

    if (typeof Shopify.clear === "undefined" || typeof Shopify.clear === undefined) {
        Shopify.clear = function (t) {
            var r = {
                type: "POST",
                url: "/cart/clear.js",
                data: "",
                dataType: "json",
                success: function (r) {
                    t(r);
                },
                error: function (t, r) {
                    Shopify.onError(t, r);
                }
            };
            jQuery.ajax(r);
        };
    }

    (function($){

        $(function () {

            if(window.location.href.indexOf("pages/cml_checkout") > -1) {
                Shopify.getCart(function (data) {
                    if (!data.items.length) {
                        alert("There are no items in the cart. Redirecting to home page.");
                        window.location = "/";
                    }
                });
            }

            if (!$.fn.on) {
                $.fn.on = function (events, selector, callback) {
                    $(document).delegate(selector, events, callback);
                }
            }

            function createOrder(customerId, address, $submit, cartData, customer_email) {

                var $self = $(this);

                if ( $self.data('requestRunning') ) {
                    return;
                }

                $self.data('requestRunning', true);

                var shippingAddress = {};
                var valid = true;
                var attributes = {};
                //var attributes = {purchase_number: $("#purchase_number").val()};
                if ($('.submit-address').length) {
                    $('.submit-address').find('[name^="address"]').each(function () {

                        shippingAddress[this.name.replace('address[', '').replace(']', '')] = this.value;

                    });
                }

                shippingAddress['shipping_charges'] = $('.submit-address').find('[name="address[shipping_charges]"]:checked').val();

                cartData.discount = '';
                if ($('#discount').val()) {
                    cartData.discount = $('#discount').val();
                }

                cartData.note = '';
                if ($('#note').val()) {
                    cartData.note = $('#note').val();
                }

                var customer_email = $("input[name=email]").val();

                $.ajax("/apps/create-cml-order", {
                    type: "post",
                    dataType: "json",
                    crossDomain: true,
                    data: {
                        customer: customerId,
                        address: address,
                        cart: cartData,
                        shipping_address: shippingAddress,
                        attributes: attributes,
                        customer_email: customer_email
                    },
                    success: function (data) {
                        if (data.success) {
                            Shopify.clear(function () {
                                show_popup();
                                //window.location.href = "/pages/"+storeArguments.handle+"-thankyou";
                            });
                        } else {
                            alert(data.error);
                        }
                    },
                    error: function () {
                        alert("An error occurred creating the order, please try again.");
                    },
                    complete: function (){
                        hide_loader();

                        $self.data('requestRunning', false);

                    }
                });

            }


            function handleCheckout(e) {

                e.preventDefault();

                if(storeArguments.instantPayment){

                    pay_instant();

                }else{

                    var $self = $(this);

                    var checkout_page = "/pages/cml_checkout";

                    show_loader();

                    if ( $self.data('requestRunning') ) {
                        return;
                    }

                    $self.data('requestRunning', true);

                    Shopify.getCart(function (data) {
                        if (!data.items.length) {
                            alert("There are no items in the cart");
                        } else {

                            // temp fix until we know everyone has installed the new confirmation page
                            $.ajax({
                                type: 'HEAD',
                                url: checkout_page,
                                success: function () {
                                    if ($self.hasClass('checkout-skipper')) {
                                        if ($('[name="note"]').length)
                                            data['note'] = $('[name="note"]').val();
                                        createOrder(storeArguments.customer, storeArguments.shopAddress, $self, data, storeArguments.customer_email);
                                    } else {
                                        window.location.href = checkout_page;
                                    }
                                },
                                error: function () {
                                    // page does not exist
                                    if ($('[name="note"]').length)
                                        data['note'] = $('[name="note"]').val();
                                    createOrder(storeArguments.customer, storeArguments.shopAddress, $self, data, storeArguments.customer_email);
                                },
                                complete: function(){
                                    $self.data('requestRunning', false);
                                }
                            });
                        }
                    });
                }
            }

            $(document).on("click", "#checkout_place_order", handleCheckout);

            $('[onclick="window.location=\'/checkout\'"]').each(function () {
                $(this).removeAttr('onclick');
                $(this).click(handleCheckout);
            });

            // when the cart action is /cart we need to handle submit buttons with the name "checkout"
            $(document).on('click', 'form[action="/cart"] [type="submit"][name="checkout"], form[action="/cart"] [type="image"], form#cartform [type="image"], form#cartform [type="submit"]', function (e) {
                handleCheckout(e);
            });

            $(document).on('submit', 'form[action="/cart"] [name="checkout"], form[action="/checkout"], form#cartform', function (e) {
                handleCheckout(e);
            });

            // prevent trade order customers from being redirected to checkout after logging in
            $('#customer_login input[name="checkout_url"]').remove();

            // remove any checkout with paypal buttons if trade orders is active
            $('.additional-checkout-buttons, .additional_checkout_buttons').remove();


        });
    }(jQuery));
    function show_popup() {
        // Initialize Variables
        var overlay = document.getElementById("overlay");
        var popup = document.getElementById("popup");
        overlay.style.display = 'block';
        popup.style.display = 'block';
    }



    function show_loader(){
        $(".loader").show();
        $("#checkout_place_order").hide();
    }
    function hide_loader(){
        $(".loader").hide();
        $("#checkout_place_order").show();
    }

}

function hide_popup() {
    // Initialize Variables
    var overlay = document.getElementById("overlay");
    var popup = document.getElementById("popup");
    overlay.style.display = 'none';
    popup.style.display = 'none';
    // similar behavior as clicking on a link
    window.location.href = '/';
}

function pay_instant() {

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            var http = new XMLHttpRequest();
            var url = '/apps/create-cml-order';
            var params = 'address='+ storeArguments.shopAddress +'&customer=' + storeArguments.customer + '&cart=' + this.responseText;
            http.open('POST', url, true);

            //Send the proper header information along with the request
            http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

            http.onreadystatechange = function() {//Call a function when the state changes.
                if(this.readyState == 4 && this.status == 200) {

                    var data = $.parseJSON(this.responseText);

                    console.log(data);

                    if(data.success){


                        window.location = data.success.invoice_url;
                        console.log(data.success.invoice_url);

                    }
                }
            }
            http.send(params);

        }
    };
    xhttp.open("GET", "/cart.js", true);
    xhttp.send();
}