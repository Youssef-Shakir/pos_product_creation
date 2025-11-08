/** @odoo-module **/
import { _t } from "@web/core/l10n/translation";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { useService } from "@web/core/utils/hooks";
import { Component } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { CreateProductPopup } from "./product_create_popup";

/**
 * OrderlineProductCreateButton هو مكون مسؤول عن إنشاء
 * منتج وإضافته إلى سطر الطلب.
 */
export class OrderlineProductCreateButton extends Component {
    static template = "point_of_sale.ProductCreateButton";

    /**
     * دالة الإعداد لتهيئة المكون.
     */
    setup() {
        this.pos = usePos();
        this.popup = useService("popup");
    }

    /**
     * دالة Getter للحصول على قائمة المنتجات بناءً على معايير البحث.
     * @returns {Object[]} قائمة المنتجات.
     */
    get products() {
        let list;
        if (this.state.search && this.state.search.trim() !== "") {
            list = this.env.pos.db.search_product_in_category(
                0,
                this.state.search.trim()
            );
        } else {
            list = this.env.pos.db.get_product_by_category(0);
        }
        return list.sort(function(a, b) {
            return a.display_name.localeCompare(b.display_name);
        });
    }

    /**
     * معالج حدث النقر على زر إنشاء المنتج.
     */
    async onClick() {
        this.popup.add(CreateProductPopup, {
            product: this.props.product,
        });
    }
}

/**
 * إضافة مكون OrderlineProductCreateButton إلى أزرار التحكم في
 * شاشة المنتجات ProductScreen.
 */
ProductScreen.addControlButton({
    component: OrderlineProductCreateButton,
});
