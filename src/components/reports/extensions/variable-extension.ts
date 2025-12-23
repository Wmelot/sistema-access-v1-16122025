import { Node, mergeAttributes } from '@tiptap/core'

export const VariableExtension = Node.create({
    name: 'variable',

    group: 'inline',

    inline: true,

    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
            },
            label: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="variable"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'variable', class: 'variable-chip' }), HTMLAttributes.label]
    },

    addCommands() {
        return {
            insertVariable: (attributes) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                })
            },
        }
    },
})
