/** @odoo-module **/

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { jsonrpc } from "@web/core/network/rpc_service";

// Global variables for image data
let img = "";
let base64_img = "";

export class CreateProductPopup extends AbstractAwaitablePopup {
    static template = "CreateProductPopup";

    setup() {
        super.setup();
        this.notification = useService("pos_notification");
        this.popup = useService("popup");

        // Initialization (no need for onMounted, as category loading is now fixed in XML)
        if (!this.env.services.pos.db.category_by_id) {
            this.env.services.pos.db.category_by_id = {};
        }
        if (!this.env.services.pos.db.pos_category_by_id) {
            this.env.services.pos.db.pos_category_by_id = {};
        }
    }


    _generateBarcode(ev) {
        // Generate a unique barcode using the current timestamp
        const now = new Date();
        const uniqueBarcode = `${now.getFullYear()}${(now.getMonth() + 1)
            .toString().padStart(2, '0')}${now.getDate()
            .toString().padStart(2, '0')}${now.getHours()
            .toString().padStart(2, '0')}${now.getMinutes()
            .toString().padStart(2, '0')}${now.getSeconds()
            .toString().padStart(2, '0')}`;
        
        document.querySelector('#barcode').value = uniqueBarcode;
    }

    _getAllProductNames() {
        const products = this.env.services.pos.db.product_by_id;
        return Object.values(products).map(p => p.name);
    }

    _setupNameAutocomplete() {
        // NOTE: The previous code for autocomplete setup contained within _setupNameAutocomplete 
        // will not execute unless explicitly called, but the logic inside _onSearchProduct handles the search correctly.
        // I am keeping this method empty as the core logic is inside _onSearchProduct.
    }

    async _onChangeImgField(ev) {
        // Image change logic remains correct
        const current = ev.target.files[0];
        if (!current) return;

        const reader = new FileReader();
        reader.readAsDataURL(current);

        reader.onload = () => {
            img = reader.result;
            base64_img = reader.result.toString().replace(/^data:(.*,)?/, "");
            setTimeout(() => {
                $("#img_url_tag_create").hide();
                $(".product-img-create-popup img").remove();
                $(".product-img-create-popup").append(
                    `<img src='${img}' style='max-width:150px; max-height:150px;' />`
                );
            }, 100);
        };
    }

    _getProductByBarcode(barcode) {
        return this.env.services.pos.db.get_product_by_barcode(barcode);
    }


    _getProductByName(name) {
        const products = this.env.services.pos.db.product_by_id;
        return Object.values(products).find(p => p.name.toLowerCase() === name.toLowerCase());
    }

    async _onSearchProduct(ev) {
        const inputVal = ev.target.value.trim();
        const statusMsgEl = document.getElementById("product_status_msg");
        const dropdown = $(".autocomplete-dropdown-container");

        // --- Clear all fields on empty input ---
        if (!inputVal) {
            $("#display_name").val("");
            $("#list_price").val("");
            $("#cost_price").val("");
            $("#default_code").val("");
            $("#product_category").val("");
            $("#barcode").val("");
            $(".product-img-create-popup img").remove();
            img = "";
            base64_img = "";
            statusMsgEl.textContent = "اكتب اسم أو باركود المنتج للبدء";
            dropdown.empty().hide();
            return;
        }

        // --- Helper to set category select from product ---
        const setCategorySelect = (product) => {
            const categorySelect = document.getElementById("product_category");
            if (product.pos_categ_ids && product.pos_categ_ids.length > 0) {
                categorySelect.value = String(product.pos_categ_ids[0]); // First category
            } else {
                categorySelect.value = "";
            }
        };

        // --- Try to find product by barcode or name ---
        let product = this._getProductByBarcode(inputVal) || this._getProductByName(inputVal);

        if (product) {
            // --- EXISTING PRODUCT: fill all fields ---
            $("#barcode").val(product.barcode || "");
            $("#display_name").val(product.name);
            $("#list_price").val(product.lst_price);
            $("#cost_price").val(product.standard_price);
            $("#default_code").val(product.default_code || "");
            setCategorySelect(product);

            // Load image
            $(".product-img-create-popup img").remove();
            if (product.image_1920) {
                img = `data:image/png;base64,${product.image_1920}`;
                $(".product-img-create-popup").append(
                    `<img src="${img}" style="max-width:150px; max-height:150px;">`
                );
            } else {
                img = "";
            }

            // --- Set the tracking + expiration checkbox properly ---
            const trackingCheckbox = document.getElementById("tracking_checkbox");
            if (trackingCheckbox) {
                trackingCheckbox.checked = product.tracking === "lot"; // only true if tracking = 'lot'
            }

            statusMsgEl.textContent = "تعديل المنتج الحالي";
            dropdown.empty().hide();
            return;
        }

        // --- AUTOCOMPLETE SEARCH ---
        const products = Object.values(this.env.services.pos.db.product_by_id);
        const matches = products.filter(p =>
            p.name.toLowerCase().includes(inputVal.toLowerCase()) ||
            (p.barcode && p.barcode.includes(inputVal))
        );

        dropdown.empty();

        if (matches.length) {
            matches.forEach(p => {
                const item = $(`<div style='padding:8px 12px; cursor:pointer; border-bottom:1px solid #eee;'>${p.name} (${p.barcode || ''})</div>`);
                item.on("click", () => {
                    // Fill all fields for selected product
                    $("#display_name").val(p.name);
                    $("#barcode").val(p.barcode || "");
                    $("#list_price").val(p.lst_price);
                    $("#cost_price").val(p.standard_price);
                    $("#default_code").val(p.default_code || "");
                    setCategorySelect(p);

                    $(".product-img-create-popup img").remove();
                    if (p.image_1920) {
                        img = `data:image/png;base64,${p.image_1920}`;
                        $(".product-img-create-popup").append(
                            `<img src="${img}" style="max-width:150px; max-height:150px;">`
                        );
                    } else {
                        img = "";
                    }
                    const trackingCheckbox = document.getElementById("tracking_checkbox");
                    if (trackingCheckbox) {
                        trackingCheckbox.checked = p.tracking === "lot"; // only true if tracking = 'lot'
                    }

                    statusMsgEl.textContent = "تعديل المنتج الحالي";
                    dropdown.empty().hide();
                });
                dropdown.append(item);
            });

            dropdown.show();
            statusMsgEl.textContent = "تعديل المنتج الحالي";
            return;
        }

        // --- NEW PRODUCT ---
        const isBarcode = /^\d+$/.test(inputVal);
        $("#barcode").val(isBarcode ? inputVal : "");
        $("#display_name").val(isBarcode ? "" : inputVal);
        $("#list_price").val("");
        $("#cost_price").val("");
        $("#default_code").val("");
        $("#product_category").val("");
        $(".product-img-create-popup img").remove();
        img = "";
        base64_img = "";

        statusMsgEl.textContent = isBarcode ? "إنشاء منتج جديد (باركود)" : "إنشاء منتج جديد";
        dropdown.hide();
    }



    async confirm() {
        const name = $("#display_name").val();
        const price = $("#list_price").val();
        const cost = $("#cost_price").val();
        const pos_category = parseInt($("#product_category").val()) || 0;
        const barcode = $("#barcode").val();
        const default_code = $("#default_code").val();
        const type = $("#type").val();
        const trackingCheckbox = document.getElementById("tracking_checkbox");

        const existingProduct = this._getProductByBarcode(barcode) || this._getProductByName(name);

        if (!name) {
            this.popup.add(ErrorPopup, { title: "خطأ", body: "الرجاء إدخال اسم المنتج." });
            return;
        }
        if (pos_category <= 0) {
            this.popup.add(ErrorPopup, { title: "خطأ", body: "الرجاء اختيار تصنيف POS للمنتج." });
            return;
        }

        const values = {
            name,
            lst_price: price ? parseFloat(price) : 0,
            standard_price: cost ? parseFloat(cost) : 0,
            type: type || "product",
            available_in_pos: true,
            tracking: trackingCheckbox && trackingCheckbox.checked ? 'lot' : 'none',
        };

        if (base64_img) values["image_1920"] = base64_img;
        if (barcode) values["barcode"] = barcode;
        if (default_code) values["default_code"] = default_code;
        if (pos_category > 0) values["pos_categ_ids"] = [[6, false, [pos_category]]];
        if (trackingCheckbox && trackingCheckbox.checked) {
            // Set expiration field on the template if stock_expiry module is installed
            values.use_expiration_date = true;
        }
        try {
            if (existingProduct) {
                await jsonrpc("/web/dataset/call_kw/product.product/write", {
                    model: "product.product",
                    method: "write",
                    args: [[existingProduct.id], values],
                    kwargs: {},
                });
                this.notification.add(_t("✅ تم تحديث المنتج بنجاح"), 3000);
            } else {
                await jsonrpc("/web/dataset/call_kw/product.product/create", {
                    model: "product.product",
                    method: "create",
                    args: [values],
                    kwargs: {},
                });
                this.notification.add(_t("✅ تم إنشاء المنتج بنجاح"), 3000);
            }

            this.cancel();

            window.location.reload();
        } catch (error) {
            this.popup.add(ErrorPopup, {
                title: "خطأ",
                body: error?.data?.message || error?.message || "فشل في حفظ المنتج"
            });
        }
    }
}