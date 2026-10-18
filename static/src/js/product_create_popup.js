/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";
import { _t } from "@web/core/l10n/translation";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { Component, useState, onMounted } from "@odoo/owl";
import { rpc } from "@web/core/network/rpc";
import { useService } from "@web/core/utils/hooks";

// Global variables for image data
let img = "";
let base64_img = "";

export class CreateProductPopup extends Component {
    static template = "pos_product_creation.CreateProductPopup";
    static components = { Dialog };

    setup() {
        this.pos = usePos();
        this.notification = useService("notification");

        this.state = useState({
            searchValue: "",
            displayName: "",
            listPrice: "",
            costPrice: "",
            barcode: "",
            defaultCode: "",
            productType: "product",
            posCategory: "",
            trackingEnabled: true,
            imageUrl: "",
            statusMessage: "اكتب اسم أو باركود المنتج للبدء",
            showDropdown: false,
            matches: [],
            selectedProduct: null,
        });

        // Initialization
        if (!this.pos.db?.category_by_id) {
            if (this.pos.db) {
                this.pos.db.category_by_id = {};
            }
        }
    }

    get categories() {
        const cats = this.pos.db?.category_by_id || this.pos.models?.['pos.category']?.records || [];
        if (Array.isArray(cats)) {
            return cats.filter(c => c.name !== 'Root');
        }
        return Object.values(cats).filter(c => c.name !== 'Root');
    }

    _generateBarcode() {
        const now = new Date();
        const uniqueBarcode = `${now.getFullYear()}${(now.getMonth() + 1)
            .toString().padStart(2, '0')}${now.getDate()
            .toString().padStart(2, '0')}${now.getHours()
            .toString().padStart(2, '0')}${now.getMinutes()
            .toString().padStart(2, '0')}${now.getSeconds()
            .toString().padStart(2, '0')}`;

        this.state.barcode = uniqueBarcode;
    }

    _getProductByBarcode(barcode) {
        if (this.pos.db?.get_product_by_barcode) {
            return this.pos.db.get_product_by_barcode(barcode);
        }
        // Odoo 18 alternative
        const products = this.pos.models?.['product.product']?.records || [];
        return products.find(p => p.barcode === barcode);
    }

    _getProductByName(name) {
        const products = this.pos.db?.product_by_id
            ? Object.values(this.pos.db.product_by_id)
            : (this.pos.models?.['product.product']?.records || []);
        return products.find(p => p.name?.toLowerCase() === name?.toLowerCase());
    }

    _getAllProducts() {
        if (this.pos.db?.product_by_id) {
            return Object.values(this.pos.db.product_by_id);
        }
        return this.pos.models?.['product.product']?.records || [];
    }

    _onSearchProduct(ev) {
        const inputVal = ev.target.value.trim();
        this.state.searchValue = inputVal;

        // Clear all fields on empty input
        if (!inputVal) {
            this.state.displayName = "";
            this.state.listPrice = "";
            this.state.costPrice = "";
            this.state.defaultCode = "";
            this.state.posCategory = "";
            this.state.barcode = "";
            this.state.imageUrl = "";
            img = "";
            base64_img = "";
            this.state.statusMessage = "اكتب اسم أو باركود المنتج للبدء";
            this.state.showDropdown = false;
            this.state.matches = [];
            this.state.selectedProduct = null;
            return;
        }

        // Try to find product by barcode or name
        let product = this._getProductByBarcode(inputVal) || this._getProductByName(inputVal);

        if (product) {
            this._fillProductFields(product);
            this.state.statusMessage = "تعديل المنتج الحالي";
            this.state.showDropdown = false;
            this.state.matches = [];
            this.state.selectedProduct = product;
            return;
        }

        // Autocomplete search
        const products = this._getAllProducts();
        const matches = products.filter(p =>
            p.name?.toLowerCase().includes(inputVal.toLowerCase()) ||
            (p.barcode && p.barcode.includes(inputVal))
        );

        if (matches.length) {
            this.state.matches = matches.slice(0, 10); // Limit to 10 results
            this.state.showDropdown = true;
            this.state.statusMessage = "تعديل المنتج الحالي";
            return;
        }

        // New product
        const isBarcode = /^\d+$/.test(inputVal);
        this.state.barcode = isBarcode ? inputVal : "";
        this.state.displayName = isBarcode ? "" : inputVal;
        this.state.listPrice = "";
        this.state.costPrice = "";
        this.state.defaultCode = "";
        this.state.posCategory = "";
        this.state.imageUrl = "";
        img = "";
        base64_img = "";
        this.state.selectedProduct = null;
        this.state.statusMessage = isBarcode ? "إنشاء منتج جديد (باركود)" : "إنشاء منتج جديد";
        this.state.showDropdown = false;
    }

    _fillProductFields(product) {
        this.state.barcode = product.barcode || "";
        this.state.displayName = product.name || product.display_name || "";
        this.state.listPrice = product.lst_price || product.list_price || "";
        this.state.costPrice = product.standard_price || "";
        this.state.defaultCode = product.default_code || "";

        if (product.pos_categ_ids && product.pos_categ_ids.length > 0) {
            this.state.posCategory = String(product.pos_categ_ids[0]);
        } else if (product.pos_categ_id) {
            this.state.posCategory = String(Array.isArray(product.pos_categ_id) ? product.pos_categ_id[0] : product.pos_categ_id);
        } else {
            this.state.posCategory = "";
        }

        if (product.image_1920) {
            img = `data:image/png;base64,${product.image_1920}`;
            this.state.imageUrl = img;
        } else {
            img = "";
            this.state.imageUrl = "";
        }

        this.state.trackingEnabled = product.tracking === "lot";
        this.state.selectedProduct = product;
    }

    _onSelectMatch(product) {
        this._fillProductFields(product);
        this.state.statusMessage = "تعديل المنتج الحالي";
        this.state.showDropdown = false;
        this.state.matches = [];
    }

    _onChangeImgField(ev) {
        const current = ev.target.files[0];
        if (!current) return;

        const reader = new FileReader();
        reader.readAsDataURL(current);

        reader.onload = () => {
            img = reader.result;
            base64_img = reader.result.toString().replace(/^data:(.*,)?/, "");
            this.state.imageUrl = img;
        };
    }

    async confirm() {
        const name = this.state.displayName;
        const price = this.state.listPrice;
        const cost = this.state.costPrice;
        const pos_category = parseInt(this.state.posCategory) || 0;
        const barcode = this.state.barcode;
        const default_code = this.state.defaultCode;
        const type = this.state.productType;
        const trackingEnabled = this.state.trackingEnabled;

        const existingProduct = this.state.selectedProduct ||
            this._getProductByBarcode(barcode) ||
            this._getProductByName(name);

        if (!name) {
            this.notification.add(_t("الرجاء إدخال اسم المنتج."), { type: "danger" });
            return;
        }
        if (pos_category <= 0) {
            this.notification.add(_t("الرجاء اختيار تصنيف POS للمنتج."), { type: "danger" });
            return;
        }

        const values = {
            name,
            lst_price: price ? parseFloat(price) : 0,
            standard_price: cost ? parseFloat(cost) : 0,
            type: type || "product",
            available_in_pos: true,
            tracking: trackingEnabled ? 'lot' : 'none',
        };

        if (base64_img) values["image_1920"] = base64_img;
        if (barcode) values["barcode"] = barcode;
        if (default_code) values["default_code"] = default_code;
        if (pos_category > 0) values["pos_categ_ids"] = [[6, false, [pos_category]]];
        if (trackingEnabled) {
            values.use_expiration_date = true;
        }

        try {
            if (existingProduct) {
                await rpc("/web/dataset/call_kw/product.product/write", {
                    model: "product.product",
                    method: "write",
                    args: [[existingProduct.id], values],
                    kwargs: {},
                });
                this.notification.add(_t("✅ تم تحديث المنتج بنجاح"), { type: "success" });
            } else {
                await rpc("/web/dataset/call_kw/product.product/create", {
                    model: "product.product",
                    method: "create",
                    args: [values],
                    kwargs: {},
                });
                this.notification.add(_t("✅ تم إنشاء المنتج بنجاح"), { type: "success" });
            }

            this.props.close();
            window.location.reload();
        } catch (error) {
            this.notification.add(
                error?.data?.message || error?.message || "فشل في حفظ المنتج",
                { type: "danger" }
            );
        }
    }

    cancel() {
        this.props.close();
    }
}
