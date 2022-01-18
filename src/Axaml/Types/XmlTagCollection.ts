import { CompletionString } from './CompletionString';
import { XmlTag } from './XmlTag';

export class XmlTagCollection extends Array<XmlTag> {
    private nsMap: Map<string, string> = new Map<string, string>();

    setNsMap(xsdNsTag: string, xsdNsStr: string): void {
        this.nsMap.set(xsdNsTag, xsdNsStr);
    }

    // TODO: to extension method
    static loadAttributesEx(tagName: string | undefined, localXmlMapping: Map<string, string>, allTagsForScope: XmlTagCollection[]): CompletionString[] {
        if (tagName !== undefined) {
            return allTagsForScope.flatMap(xtc => {
                const fixedNames = xtc.fixNsReverse(tagName, localXmlMapping);
                return fixedNames.flatMap(fixn => XmlTagCollection.loadAttributes(fixn, allTagsForScope));
            });
        }

        return [];
    }

    // TODO: to extension method
    static loadTagEx(tagName: string | undefined, localXmlMapping: Map<string, string>, allTagsForScope: XmlTagCollection[]): CompletionString | undefined {
        if (tagName !== undefined) {
            return allTagsForScope
                .map(xtc => {
                    const fixedNames = xtc.fixNsReverse(tagName, localXmlMapping);
                    return xtc.find(e => fixedNames.includes(e.tag.name))?.tag;
                })
                .find(cs => cs !== undefined);
        }

        return undefined;
    }

    // TODO: to extension method
    private static loadAttributes(tagName: string | undefined, allTagsForScope: XmlTagCollection[] = [], handledNames: string[] = []): CompletionString[] {

        const tagNameCompare = (a: string, b: string) => a === b || b.endsWith(`:${a}`);

        const result: CompletionString[] = [];
        if (tagName !== undefined) {
            handledNames.push(tagName);
            const currentTags = allTagsForScope.flatMap(t => t).filter(e => tagNameCompare(e.tag.name, tagName));
            if (currentTags.length > 0) {
                result.push(...currentTags.flatMap(e => e.attributes));
                result.push(...currentTags.flatMap(e =>
                    e.base.filter(b => !handledNames.includes(b))
                        .flatMap(b => XmlTagCollection.loadAttributes(b, allTagsForScope, handledNames))));
            }
        }
        return result;
    }

    fixNs(xsdString: CompletionString, localXmlMapping: Map<string, string>): CompletionString {
        const arr = xsdString.name.split(":");
        if (arr.length === 2 && this.nsMap.has(arr[0]) && localXmlMapping.has(this.nsMap[arr[0]])) {
            return new CompletionString(`${localXmlMapping[this.nsMap[arr[0]]]}:${arr[1]}`, xsdString.comment, xsdString.definitionUri, xsdString.definitionLine, xsdString.definitionColumn);
        }
        return xsdString;
    }

    fixNsReverse(xmlString: string, localXmlMapping: Map<string, string>): Array<string> {
        const arr = xmlString.split(":");
        const xmlStrings = new Array<string>();

        localXmlMapping.forEach((v, k) => {
            if (v === arr[0]) {
                this.nsMap.forEach((v2, k2) => {
                    if (v2 == k) {
                        xmlStrings.push(`${k2}:${arr[1]}`);
                    }
                });
            }
        });
        xmlStrings.push(arr[arr.length - 1]);

        return xmlStrings;
    }
}