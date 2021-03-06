#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "util.h"

void *checked_malloc(int len)
{
    void *p = malloc(len);
    if(!p)
    {
        fprintf(stderr, "\n Ran out of memory\n");
        exit(1);
    }
    return p;
}

string String(char *s)
{
    string p = checked_malloc(sizeof(s) + 1);
    strcpy(p, s);
    return p;
}

string concat(char *str1, char *str2)
{
    string result = checked_malloc((strlen(str1) + strlen(str2) + 1) * sizeof(char));
    strcpy(result, str1);
    strcat(result, str2);
    return result;
}

U_boolList U_BoolList(bool head, U_boolList tail)
{
    U_boolList list = checked_malloc(sizeof(*list));
    list->head = head;
    list->tail = tail;
    return list;
}
bool toByte(string fname, string tempFileName)
{
    setlocale(LC_CTYPE, "");
    FILE *file;
    FILE *output;
    wchar_t c;
    wchar_t *str;
    file = fopen(fname, "r, ccs = UTF16LE");
    const size_t nameLength = (sizeof fname / sizeof *fname) + 5; 

    output = fopen(tempFileName, "w, css = UTF16LE");
    // str = fgetws(str, 2, file);
    // size_t size = sizeof str / sizeof *str;
    // wprintf("%ls", str);
    // for(int i = 0; i < size; i++)
    // {
    //     printf("b");
    //     if(str[i] == L'＜')
    //         printf("a");
    // }
    while((c = fgetwc(file)) != EOF)
    {
        // printf("%lc", c);
        switch(c)
        {
            case L'＜':
                fputc('<', output);
                break;
            case L'＞':
                fputc('>', output);
                break;
            case L'（':
                fputc('(', output);
                break;
            case L'）':
                fputc(')', output);
                break;
            case L'｛':
                fputc('{', output);
                break;
            case L'｝':
                fputc('}', output);
                break;    
            case L'．':
                fputc('.', output);
                break;
            case L'、':
                fputc(',', output);
                break;
            case L'；':
                fputc(';', output);
                break;
            case L'：':
                fputc(':', output);
                break;
            case L'＊':
                fputc('*', output);
                break;
            case L'＝':
                fputc('=', output);
                break;
            case L'！':
                fputc('!', output);
                break;
            case L'｜':
                fputc('|', output);
                break;
            case L'「':
                fputc('"', output);
                break;
            case L'」':
                fputc('"', output);
                break;
            case L'１':
                fputc('1', output);
                break;
            case L'２':
                fputc('2', output);
                break;
            case L'３':
                fputc('3', output);
                break;
            case L'４':
                fputc('4', output);
                break;
            case L'５':
                fputc('5', output);
                break;
            case L'６':
                fputc('6', output);
                break;
            case L'７':
                fputc('7', output);
                break;
            case L'８':
                fputc('8', output);
                break;
            case L'９':
                fputc('9', output);
                break;
            case L'０':
                fputc('0', output);
                break;
            case L'　':
                fputc(' ', output);
                break;
            case L'＋':
                fputc('+', output);
                break;
            case L'ー':
                fputc('-', output);
                break;
            default:
                fprintf(output, "%lc", c);
        }
        // if(c == L'＜')
        //     fputc('<', output);
        // else
        // {
        //     fprintf(output, "%lc", c);
        // }
    }
    fclose(file);
    fclose(output);
    return TRUE;
}