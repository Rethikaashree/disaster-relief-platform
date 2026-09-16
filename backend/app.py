from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)


# ============================================================
# MYSQL CONFIGURATION
# ============================================================

DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "sruthi1101/"
DB_NAME = "flood_relief_db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():

    try:

        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )

        if connection.is_connected():
            return connection

    except Error as e:

        print("MySQL Connection Error:", e)

    return None


# ============================================================
# CREATE / UPDATE TABLES
# ============================================================

def create_tables():

    connection = get_db_connection()

    if connection is None:

        print("Unable to create/update tables.")
        return

    cursor = None

    try:

        cursor = connection.cursor()

        # ====================================================
        # USERS
        # ====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL PRIMARY KEY,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL
            )
        """)


        # ====================================================
        # BENEFICIARIES
        # ====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS beneficiaries (
                beneficiary_id INT NOT NULL AUTO_INCREMENT,
                full_name VARCHAR(100) NOT NULL,
                age INT,
                gender VARCHAR(20),
                phone VARCHAR(20),
                aadhaar_number VARCHAR(20),
                family_members INT,
                camp_name VARCHAR(100),
                address TEXT,
                PRIMARY KEY (beneficiary_id)
            )
        """)


        # ====================================================
        # CAMPS
        # ====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS camps (
                camp_id INT NOT NULL AUTO_INCREMENT,
                camp_name VARCHAR(100) NOT NULL,
                location VARCHAR(255),
                capacity INT DEFAULT 0,
                available_resources VARCHAR(255),
                PRIMARY KEY (camp_id)
            )
        """)


        # ====================================================
        # IMPORTANT:
        # ADD available_resources TO OLD CAMPS TABLE
        # IF IT DOES NOT EXIST
        # ====================================================

        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
            AND table_name = 'camps'
            AND column_name = 'available_resources'
        """, (DB_NAME,))

        column_exists = cursor.fetchone()[0]


        if column_exists == 0:

            print("Adding missing available_resources column...")

            cursor.execute("""
                ALTER TABLE camps
                ADD COLUMN available_resources VARCHAR(255)
            """)

            print(
                "available_resources column added successfully."
            )


        # ====================================================
        # RESOURCES
        # ====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resources (
                resource_id INT NOT NULL AUTO_INCREMENT,
                resource_name VARCHAR(100) NOT NULL,
                quantity INT DEFAULT 0,
                camp_name VARCHAR(100),
                description VARCHAR(255),
                PRIMARY KEY (resource_id)
            )
        """)


        # ====================================================
        # DISTRIBUTION
        # ====================================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS distribution (
                distribution_id INT NOT NULL AUTO_INCREMENT,
                beneficiary_id INT,
                resource_name VARCHAR(100),
                quantity INT,
                camp_name VARCHAR(100),
                distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (distribution_id)
            )
        """)


        connection.commit()

        print(
            "Database tables checked/updated successfully."
        )


    except Error as e:

        print(
            "Table creation/update error:",
            e
        )


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "Flood Relief Backend Running"
    })


# ============================================================
# SIGNUP
# ============================================================

@app.route("/signup", methods=["POST"])
def signup():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        data = request.get_json() or {}

        full_name = str(
            data.get("full_name", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip().lower()

        phone = str(
            data.get("phone", "")
        ).strip()

        password = str(
            data.get("password", "")
        )


        if not full_name:

            return jsonify({
                "success": False,
                "message": "Full name is required"
            }), 400


        if not email:

            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400


        if not password:

            return jsonify({
                "success": False,
                "message": "Password is required"
            }), 400


        cursor = connection.cursor(
            buffered=True
        )

        cursor.execute("""
            SELECT email
            FROM users
            WHERE email = %s
        """, (email,))

        existing_user = cursor.fetchone()


        if existing_user:

            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 409


        hashed_password = generate_password_hash(
            password
        )


        cursor.execute("""
            INSERT INTO users
            (
                full_name,
                email,
                phone,
                password
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
        """, (
            full_name,
            email,
            phone,
            hashed_password
        ))


        connection.commit()


        return jsonify({
            "success": True,
            "message": "Account created successfully"
        }), 201


    except Error as e:

        connection.rollback()

        print(
            "Signup database error:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Database error: " + str(e)
        }), 500


    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# LOGIN
# ============================================================

@app.route("/login", methods=["POST"])
def login():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        data = request.get_json() or {}

        email = str(
            data.get("email", "")
        ).strip().lower()

        password = str(
            data.get("password", "")
        )


        if not email:

            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400


        if not password:

            return jsonify({
                "success": False,
                "message": "Password is required"
            }), 400


        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )

        cursor.execute("""
            SELECT
                full_name,
                email,
                phone,
                password
            FROM users
            WHERE email = %s
        """, (email,))


        user = cursor.fetchone()


        if not user:

            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401


        stored_password = user["password"]

        password_valid = False


        try:

            password_valid = check_password_hash(
                stored_password,
                password
            )

        except Exception:

            password_valid = False


        # Support old plain-text passwords

        if not password_valid:

            if stored_password == password:

                password_valid = True


        if not password_valid:

            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401


        return jsonify({

            "success": True,

            "status": True,

            "message": "Login successful",

            "user": {

                "full_name": user["full_name"],

                "email": user["email"],

                "phone": user["phone"]

            }

        }), 200


    except Error as e:

        print(
            "Login database error:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Database error: " + str(e)
        }), 500


    except Exception as e:

        print(
            "Login error:",
            e
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# AADHAAR VERIFICATION
# ============================================================

@app.route("/verifyaadhaar", methods=["POST"])
def verify_aadhaar():

    try:

        data = request.get_json() or {}

        aadhaar = str(
            data.get(
                "aadhaar_number",
                ""
            )
        ).strip()


        aadhaar = aadhaar.replace(
            " ",
            ""
        )


        if not aadhaar:

            return jsonify({
                "success": False,
                "message": "Aadhaar number is required"
            }), 400


        if not aadhaar.isdigit():

            return jsonify({
                "success": False,
                "message":
                    "Aadhaar number must contain only digits"
            }), 400


        if len(aadhaar) != 12:

            return jsonify({
                "success": False,
                "message":
                    "Aadhaar number must contain exactly 12 digits"
            }), 400


        return jsonify({

            "success": True,

            "verified": True,

            "message":
                "Aadhaar number verified successfully"

        }), 200


    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ============================================================
# REGISTER BENEFICIARY
# ============================================================

@app.route("/register", methods=["POST"])
def register_beneficiary():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        data = request.get_json() or {}


        full_name = str(
            data.get(
                "full_name",
                ""
            )
        ).strip()


        age = data.get("age")


        gender = str(
            data.get(
                "gender",
                ""
            )
        ).strip()


        phone = str(
            data.get(
                "phone",
                ""
            )
        ).strip()


        aadhaar = str(
            data.get(
                "aadhaar_number",
                ""
            )
        ).strip()


        family_members = data.get(
            "family_members"
        )


        camp_name = str(
            data.get(
                "camp_name",
                ""
            )
        ).strip()


        address = str(
            data.get(
                "address",
                ""
            )
        ).strip()


        aadhaar = aadhaar.replace(
            " ",
            ""
        )


        if not full_name:

            return jsonify({
                "success": False,
                "message": "Full name is required"
            }), 400


        if aadhaar:

            if not aadhaar.isdigit():

                return jsonify({
                    "success": False,
                    "message":
                        "Aadhaar number must contain only digits"
                }), 400


            if len(aadhaar) != 12:

                return jsonify({
                    "success": False,
                    "message":
                        "Aadhaar number must contain exactly 12 digits"
                }), 400


        cursor = connection.cursor(
            buffered=True
        )


        cursor.execute("""
            INSERT INTO beneficiaries
            (
                full_name,
                age,
                gender,
                phone,
                aadhaar_number,
                family_members,
                camp_name,
                address
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            full_name,
            age,
            gender,
            phone,
            aadhaar,
            family_members,
            camp_name,
            address
        ))


        beneficiary_id = cursor.lastrowid


        connection.commit()


        return jsonify({

            "success": True,

            "message":
                "Beneficiary registered successfully",

            "beneficiary_id":
                beneficiary_id

        }), 201


    except Error as e:

        connection.rollback()

        print(
            "Beneficiary database error:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Database error: " + str(e)
        }), 500


    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# GET BENEFICIARIES
# ============================================================

@app.route("/getbeneficiaries", methods=["GET"])
def get_beneficiaries():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )


        cursor.execute("""
            SELECT
                beneficiary_id,
                full_name,
                age,
                gender,
                phone,
                aadhaar_number,
                family_members,
                camp_name,
                address
            FROM beneficiaries
            ORDER BY beneficiary_id DESC
        """)


        beneficiaries = cursor.fetchall()


        return jsonify({

            "success": True,

            "beneficiaries":
                beneficiaries

        }), 200


    except Error as e:

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# ADD CAMP
# ============================================================

@app.route("/addcamp", methods=["POST"])
def add_camp():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        data = request.get_json() or {}


        camp_name = str(
            data.get(
                "camp_name",
                ""
            )
        ).strip()


        location = str(
            data.get(
                "location",
                ""
            )
        ).strip()


        capacity = data.get(
            "capacity",
            0
        )


        available_resources = str(
            data.get(
                "available_resources",
                ""
            )
        ).strip()


        if not camp_name:

            return jsonify({
                "success": False,
                "message": "Camp name is required"
            }), 400


        if not location:

            return jsonify({
                "success": False,
                "message": "Location is required"
            }), 400


        try:

            capacity = int(
                capacity
            )

        except:

            capacity = 0


        if capacity < 0:

            return jsonify({
                "success": False,
                "message":
                    "Capacity cannot be negative"
            }), 400


        cursor = connection.cursor(
            buffered=True
        )


        cursor.execute("""
            INSERT INTO camps
            (
                camp_name,
                location,
                capacity,
                available_resources
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
        """, (
            camp_name,
            location,
            capacity,
            available_resources
        ))


        camp_id = cursor.lastrowid


        connection.commit()


        return jsonify({

            "success": True,

            "message":
                "Camp added successfully",

            "camp_id":
                camp_id

        }), 201


    except Error as e:

        connection.rollback()

        print(
            "Add Camp database error:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# GET CAMPS
# ============================================================

@app.route("/getcamps", methods=["GET"])
def get_camps():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )


        cursor.execute("""
            SELECT
                camp_id,
                camp_name,
                location,
                capacity,
                available_resources
            FROM camps
            ORDER BY camp_id DESC
        """)


        camps = cursor.fetchall()


        return jsonify({

            "success": True,

            "camps":
                camps

        }), 200


    except Error as e:

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# DELETE CAMP
# ============================================================

@app.route("/deletecamp/<int:camp_id>", methods=["DELETE"])
def delete_camp(camp_id):

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        cursor = connection.cursor(
            buffered=True
        )


        cursor.execute("""
            SELECT
                camp_id
            FROM camps
            WHERE camp_id = %s
        """, (
            camp_id,
        ))


        camp = cursor.fetchone()


        if not camp:

            return jsonify({
                "success": False,
                "message": "Camp not found"
            }), 404


        cursor.execute("""
            DELETE FROM camps
            WHERE camp_id = %s
        """, (
            camp_id,
        ))


        connection.commit()


        return jsonify({

            "success": True,

            "message":
                "Camp deleted successfully"

        }), 200


    except Error as e:

        connection.rollback()

        print(
            "Delete Camp database error:",
            e
        )

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    except Exception as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# ADD RESOURCE
# ============================================================

@app.route("/addresource", methods=["POST"])
def add_resource():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        data = request.get_json() or {}


        resource_name = str(
            data.get(
                "resource_name",
                ""
            )
        ).strip()


        quantity = data.get(
            "quantity",
            0
        )


        camp_name = str(
            data.get(
                "camp_name",
                ""
            )
        ).strip()


        description = str(
            data.get(
                "description",
                ""
            )
        ).strip()


        if not resource_name:

            return jsonify({
                "success": False,
                "message":
                    "Resource name is required"
            }), 400


        try:

            quantity = int(
                quantity
            )

        except:

            quantity = 0


        if quantity < 0:

            return jsonify({
                "success": False,
                "message":
                    "Quantity cannot be negative"
            }), 400


        cursor = connection.cursor(
            buffered=True
        )


        cursor.execute("""
            INSERT INTO resources
            (
                resource_name,
                quantity,
                camp_name,
                description
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
        """, (
            resource_name,
            quantity,
            camp_name,
            description
        ))


        resource_id = cursor.lastrowid


        connection.commit()


        return jsonify({

            "success": True,

            "message":
                "Resource added successfully",

            "resource_id":
                resource_id

        }), 201


    except Error as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# GET RESOURCES
# ============================================================

@app.route("/getresources", methods=["GET"])
def get_resources():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )


        cursor.execute("""
            SELECT
                resource_id,
                resource_name,
                quantity,
                camp_name,
                description
            FROM resources
            ORDER BY resource_id DESC
        """)


        resources = cursor.fetchall()


        return jsonify({

            "success": True,

            "resources":
                resources

        }), 200


    except Error as e:

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# DISTRIBUTE RESOURCE
# ============================================================

@app.route("/distribution", methods=["POST"])
def distribute_resource():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        data = request.get_json() or {}


        beneficiary_id = data.get(
            "beneficiary_id"
        )


        resource_name = str(
            data.get(
                "resource_name",
                ""
            )
        ).strip()


        quantity = data.get(
            "quantity",
            0
        )


        camp_name = str(
            data.get(
                "camp_name",
                ""
            )
        ).strip()


        if not beneficiary_id:

            return jsonify({
                "success": False,
                "message":
                    "Beneficiary ID is required"
            }), 400


        if not resource_name:

            return jsonify({
                "success": False,
                "message":
                    "Resource name is required"
            }), 400


        try:

            quantity = int(
                quantity
            )

        except:

            quantity = 0


        if quantity <= 0:

            return jsonify({
                "success": False,
                "message":
                    "Quantity must be greater than 0"
            }), 400


        cursor = connection.cursor(
            buffered=True
        )


        # CHECK BENEFICIARY

        cursor.execute("""
            SELECT
                beneficiary_id
            FROM beneficiaries
            WHERE beneficiary_id = %s
        """, (
            beneficiary_id,
        ))


        beneficiary = cursor.fetchone()


        if not beneficiary:

            return jsonify({
                "success": False,
                "message":
                    "Beneficiary not found"
            }), 404


        # CHECK RESOURCE

        cursor.execute("""
            SELECT
                resource_id,
                quantity
            FROM resources
            WHERE resource_name = %s
            LIMIT 1
        """, (
            resource_name,
        ))


        resource = cursor.fetchone()


        if not resource:

            return jsonify({
                "success": False,
                "message":
                    "Resource not found"
            }), 404


        if resource[1] < quantity:

            return jsonify({
                "success": False,
                "message":
                    "Insufficient resource quantity"
            }), 400


        # INSERT DISTRIBUTION

        cursor.execute("""
            INSERT INTO distribution
            (
                beneficiary_id,
                resource_name,
                quantity,
                camp_name
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
        """, (
            beneficiary_id,
            resource_name,
            quantity,
            camp_name
        ))


        distribution_id = cursor.lastrowid


        # REDUCE RESOURCE

        cursor.execute("""
            UPDATE resources
            SET quantity = quantity - %s
            WHERE resource_id = %s
        """, (
            quantity,
            resource[0]
        ))


        connection.commit()


        return jsonify({

            "success": True,

            "message":
                "Resource distributed successfully",

            "distribution_id":
                distribution_id

        }), 201


    except Error as e:

        connection.rollback()

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# GET DISTRIBUTION
# ============================================================

@app.route("/getdistribution", methods=["GET"])
def get_distribution():

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:

        cursor = connection.cursor(
            dictionary=True,
            buffered=True
        )


        cursor.execute("""
            SELECT
                distribution_id,
                beneficiary_id,
                resource_name,
                quantity,
                camp_name,
                distribution_date
            FROM distribution
            ORDER BY distribution_id DESC
        """)


        distributions = cursor.fetchall()


        return jsonify({

            "success": True,

            "distributions":
                distributions

        }), 200


    except Error as e:

        return jsonify({
            "success": False,
            "message":
                "Database error: " + str(e)
        }), 500


    finally:

        if cursor:
            cursor.close()

        connection.close()


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    print("--------------------------------------------")
    print("      FLOOD RELIEF PORTAL BACKEND")
    print("--------------------------------------------")

    create_tables()

    print("")
    print("Server running at:")
    print("http://127.0.0.1:5000")
    print("")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
    