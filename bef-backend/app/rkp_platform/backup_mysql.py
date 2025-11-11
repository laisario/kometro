import pymysql
from datetime import datetime

DB_USER = "rkp2023"
DB_PASSWORD = "aa350c16fefe20014d892adcc66a9d8"
DB_NAME = "rkp2023$default"
DB_HOST = "rkp2023.mysql.pythonanywhere-services.com"

OUTPUT_FILE = "backup.sql"


def escape(value):
    return str(value).replace("'", "''")


def dump_table(cursor, table):
    cursor.execute(f"SHOW CREATE TABLE `{table}`")
    drop_stmt = f"DROP TABLE IF EXISTS `{table}`;\n"
    create_stmt = cursor.fetchone()[1] + ";\n\n"

    cursor.execute(f"SELECT * FROM `{table}`")
    rows = cursor.fetchall()

    insert_statements = ""
    for row in rows:
        values = ", ".join(
            [f"'{escape(value)}'" if value is not None else "NULL" for value in row]
        )
        insert_statements += f"INSERT INTO `{table}` VALUES ({values});\n"

    return drop_stmt + create_stmt + insert_statements + "\n"


def backup_database():
    print(f"Conectando ao banco {DB_NAME}...")
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.Cursor,
    )

    print("Conectado. Iniciando backup...")
    with connection:
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = [row[0] for row in cursor.fetchall()]

            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                f.write(f"-- Backup do banco: {DB_NAME}\n")
                f.write(f"-- Criado em: {datetime.now()}\n\n")
                f.write("SET NAMES utf8mb4;\n")
                f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")
                for table in tables:
                    print(f"Exportando tabela: {table}")
                    sql = dump_table(cursor, table)
                    f.write(sql)
                f.write("\nSET FOREIGN_KEY_CHECKS=1;\n")

    print(f"Backup salvo em {OUTPUT_FILE}")


if __name__ == "__main__":
    backup_database()
