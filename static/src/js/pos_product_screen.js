/** @odoo-module **/

import { ControlButtons } from "@point_of_sale/app/screens/product_screen/control_buttons/control_buttons";
import { CreateProductPopup } from "./product_create_popup";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";

/**
 * Patch ControlButtons to add product creation functionality
 */
patch(ControlButtons.prototype, {
    /**
     * Handler for clicking the product create button
     */
    async onClickProductCreate() {
        this.dialog.add(CreateProductPopup, {
            title: _t("إنشاء أو تعديل المنتج"),
        });
    }
});
