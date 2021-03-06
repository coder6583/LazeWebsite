#include <stdio.h>
#include <stdlib.h>
#include "util.h"
#include "errormsg.h"
#include "symbol.h"
#include "absyn.h"
#include "y.tab.h"
#include "parse.h"

YYSTYPE yylval;
extern int yydebug;

int yylex(void);

extern int yyparse(void);

string toknames[] = 
{
    "ID", "STRING", "INT", "REAL", "COMMA", "COLON", "SEMICOLON", "LPAREN", "RPAREN", "LBRACK", "RBRACK",
    "LBRACE", "RBRACE", "DOT", "PLUS", "MINUS", "TIME", "DIVIDE", "EQ", "NEQ", "LT", "LE",
    "GT", "GE", "AND", "OR", "ASSIGN", "ARRAY", "IF", "THEN", "ELSE", "FROM", "TO", "BREAK",
    "INTTYPE", "CHARTYPE", "STRINGTYPE", "REALTYPE", "CONTINUE"
};

string tokname(tok)
{
    return tok<258 || tok>295 ? "BAD_TOKEN" : toknames[tok-258];
}

void parseTest(string fname)
{
    EM_reset(fname);
    if(yyparse() == 0)
    {
        fprintf(stdout, "Parsing Successful\n");
    }
    else
    {
        fprintf(stderr, "Parsing Failed\n");
        exit(1);
    }
}

int main(int argc, char **argv)
{
    // setlocale(LC_CTYPE, "C.UTF-16");
    // yydebug = 1;
    string fname, directory;
    int tok;
    if(argc != 2 && argc != 3)
    {
        fprintf(stderr, "usage: ./a.out filename\n      ./a.out filename directory\nargument count: %d\n", argc);
        exit(1);
    }
    fname = argv[1];
    directory = argv[2];
    string tempFileName = concat(".", fname);
    if(argc == 3)
    {
        string fullFname = concat(directory, fname);
        string fullTempFname = concat(directory, tempFileName);
        FILE *temp = fopen(fullTempFname, "w");
        fclose(temp);
        EM_reset(fullTempFname);
        while(!toByte(fullFname, fullTempFname));
        fprintf(stdout, "\n");
        // parse(tempFileName);
        parseTest(fullTempFname);
    }
    else
    {
        FILE *temp = fopen(tempFileName, "w");
        fclose(temp);
        EM_reset(tempFileName);
        while(!toByte(fname, tempFileName));
        fprintf(stdout, "\n");
        // parse(tempFileName);
        parseTest(tempFileName);
    }

    // for(;;)
    // {
    //     tok = yylex();
        
    //     if(tok == 0)
    //         break;
    //     switch(tok)
    //     {
    //         case ID: case STRING:
    //             printf("%10s %4d %s \n", tokname(tok), EM_tokPos, yylval.sval);
    //             break;
    //         case INT:
    //             printf("%10s %4d %d \n", tokname(tok), EM_tokPos, yylval.ival);
    //             break;
    //         case REAL:
    //             printf("%10s %4d %f\n", tokname(tok), EM_tokPos, yylval.fval);
    //             break;
    //         default:
    //             printf("%10s %4d\n", tokname(tok), EM_tokPos);
    //     }
    // }
    return 0;
}