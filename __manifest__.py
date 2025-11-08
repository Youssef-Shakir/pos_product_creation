# -*- coding: utf-8 -*-
##############################################################################
#
#    Cybrosys Technologies Pvt. Ltd.
#
#    Copyright (C) 2023-TODAY Cybrosys Technologies(<https://www.cybrosys.com>).
#    Author: Mruthul Raj @cybrosys(odoo@cybrosys.com)
#
#    You can modify it under the terms of the GNU AFFERO
#    GENERAL PUBLIC LICENSE (AGPL v3), Version 3.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU AFFERO GENERAL PUBLIC LICENSE (AGPL v3) for more details.
#
#    You should have received a copy of the GNU AFFERO GENERAL PUBLIC LICENSE
#    (AGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
###############################################################################
{
    'name': 'POS Product Creation Popup Module',
    'version': '17.0.1.0.0',
    'category': 'Point of Sale',
    'summary': 'create or edit products directly from the POS interface',
    'description': """This Odoo POS module adds a custom popup that allows users to create or edit products directly from the POS interface without leaving the session. It streamlines product management, including setting pricing, barcode, image, POS category, and tracking options.""",
    'author': 'Yousif Shakir',
    'company': 'Donia2link',
    'maintainer': 'Yousif Shakir',
    'website': 'https://www.donia-link.com',
    'depends': ['point_of_sale'],
    'assets': {
        'point_of_sale._assets_pos': [
            'pos_product_creation/static/src/js/pos_product_screen.js',
            'pos_product_creation/static/src/js/product_create_popup.js',
            'pos_product_creation/static/src/xml/product_create_button_templates.xml',
            'pos_product_creation/static/src/xml/product_create_popup_templates.xml',
        ]
    },
    'images': ['static/description/banner.png'],
    'license': 'AGPL-3',
    'installable': True,
    'auto_install': False,
    'application': False,
}
