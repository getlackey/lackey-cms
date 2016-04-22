/* jslint node:true, esnext:true */
'use strict';

const Model = require('prosemirror/dist/model'),
	Block = Model.Block,
	Attribute = Model.Attribute;


class Website extends Block {
	get attrs() {
		return {
			src: new Attribute(),
			width: new Attribute({
				default: 200
			}),
			height: new Attribute({
				default: 200
			})
		};
	}
	get contains() {
		return null;
	}
}

Website.prototype.serializeDOM = (node, s) => s.renderAs(node, 'iframe', {
	src: node.attrs.src,
	content: 'text/html;charset=UTF-8',
	frameborder: '0',
	allowfullscreen: '1'
});

Website.prototype.serializeMarkdown = (s, node) => {
	s.write('[IFRAME](' + s.esc(node.attrs.src) + ')');
};

Website.register('parseDOM', 'a', {
	rank: 25,
	parse: function (domObj, state) {

		if (domObj.innerTex !== 'IFRAME') {
			return false;
		}

		state.wrapIn(this, {
			type: this.type,
			src: domObj.href
		});
	}
});

function selectedNodeAttr(pm, type, name) {
	let node = pm.selection.node;
	if (node && node.type === type) return node.attrs[name];
}

function getBlockPos(pm, $pos) {
	for (let i = $pos.depth; i > 0; i--) {
		if ($pos.node(i).type instanceof Block) return $pos.end(i);
	}
	return $pos.end(0);
}

function insertWidget(pm, pos, w) {
	let $pos = pm.doc.resolve(pos);
	return pm.tr.insert(getBlockPos(pm, $pos), w).apply(pm.apply.scroll);
}

Website.register('command', 'insert', {
	label: 'Website',
	menu: {
		group: 'insert',
		rank: 71,
		display: {
			type: 'label',
			label: 'IFRAME'
		}
	},
	run(pm, src) {
		let from = pm.selection.from,
			node = pm.selection.node;
		if (node && node.type === this) {
			let tr = pm.tr.setNodeType(from, this, {
				src
			}).apply();
			return tr;
		} else {
			return insertWidget(pm, from, this.create({
				src
			}));
		}
	},
	select() {
		return true;
	},
	params: [
		{
			name: 'URL',
			attr: 'src',
			label: 'Link to website, youTube, Google Maps ...',
			type: 'text',
			prefill: function (pm) {
				return selectedNodeAttr(pm, this, 'src');
			}
		}
	]
});

module.exports.iframe = Website;
